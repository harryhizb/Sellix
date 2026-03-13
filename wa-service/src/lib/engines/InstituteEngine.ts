import { SessionContext, BotState, RuleEngineResponse } from '../types';
import { productService } from '../ProductService';
import { TemplateRegistry } from '../templates/TemplateRegistry';
import { normalizeInput } from '../normalization';
import { isListSelection } from '../utils/inputParser';

export class InstituteEngine {
    async handleBrowseCourses(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        // We'll treat 'courses' as products with category='course' (or just fetch products for institutes)
        const courses = await productService.getProducts(session.businessId, { limit: 10 });
        session.lastShownProducts = courses;

        const response = TemplateRegistry.instituteCourses(courses);
        return { response, newState: BotState.BROWSING_COURSES, updatedSession: session };
    }

    async handleCourseBrowsing(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        if (input.includes('back')) {
            const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
            return {
                response: TemplateRegistry.mainMenu(context.name || 'Menu', context.capabilities, storeUrl),
                newState: BotState.MAIN_MENU,
                updatedSession: session
            };
        }

        const num = isListSelection(input);
        if (num && session.lastShownProducts && session.lastShownProducts[num - 1]) {
            const course = session.lastShownProducts[num - 1];
            session.meta = { ...session.meta, focusingProduct: course };
            session.currentProduct = course;

            const response = TemplateRegistry.instituteCourseDetail(course);
            return { response, newState: BotState.VIEWING_PRODUCT, updatedSession: session };
        }

        return this.handleBrowseCourses(session, context);
    }

    async handleViewingCourse(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);

        if (input === '1' || input.includes('enroll') || input.includes('apply')) {
            const response = TemplateRegistry.instituteAdmissions(context);
            return { response, newState: BotState.IDLE, updatedSession: session };
        }

        if (input === '2' || input.includes('back')) {
            return this.handleBrowseCourses(session, context);
        }

        if (input === '3' || input.includes('menu')) {
            const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
            return {
                response: TemplateRegistry.mainMenu(context.name || 'Menu', context.capabilities, storeUrl),
                newState: BotState.MAIN_MENU,
                updatedSession: session
            };
        }

        return {
            response: { text: "Reply with *1* to Enroll, *2* for back to Courses, or *3* for Main Menu." },
            newState: BotState.VIEWING_PRODUCT,
            updatedSession: session
        };
    }
}

export const instituteEngine = new InstituteEngine();
