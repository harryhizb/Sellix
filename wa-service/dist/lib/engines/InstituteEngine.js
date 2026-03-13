"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instituteEngine = exports.InstituteEngine = void 0;
const types_1 = require("../types");
const ProductService_1 = require("../ProductService");
const TemplateRegistry_1 = require("../templates/TemplateRegistry");
const normalization_1 = require("../normalization");
const inputParser_1 = require("../utils/inputParser");
class InstituteEngine {
    handleBrowseCourses(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // We'll treat 'courses' as products with category='course' (or just fetch products for institutes)
            const courses = yield ProductService_1.productService.getProducts(session.businessId, { limit: 10 });
            session.lastShownProducts = courses;
            const response = TemplateRegistry_1.TemplateRegistry.instituteCourses(courses);
            return { response, newState: types_1.BotState.BROWSING_COURSES, updatedSession: session };
        });
    }
    handleCourseBrowsing(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = (0, normalization_1.normalizeInput)(message);
            if (input.includes('back')) {
                const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
                return {
                    response: TemplateRegistry_1.TemplateRegistry.mainMenu(context.name || 'Menu', context.capabilities, storeUrl),
                    newState: types_1.BotState.MAIN_MENU,
                    updatedSession: session
                };
            }
            const num = (0, inputParser_1.isListSelection)(input);
            if (num && session.lastShownProducts && session.lastShownProducts[num - 1]) {
                const course = session.lastShownProducts[num - 1];
                session.meta = Object.assign(Object.assign({}, session.meta), { focusingProduct: course });
                session.currentProduct = course;
                const response = TemplateRegistry_1.TemplateRegistry.instituteCourseDetail(course);
                return { response, newState: types_1.BotState.VIEWING_PRODUCT, updatedSession: session };
            }
            return this.handleBrowseCourses(session, context);
        });
    }
    handleViewingCourse(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = (0, normalization_1.normalizeInput)(message);
            if (input === '1' || input.includes('enroll') || input.includes('apply')) {
                const response = TemplateRegistry_1.TemplateRegistry.instituteAdmissions(context);
                return { response, newState: types_1.BotState.IDLE, updatedSession: session };
            }
            if (input === '2' || input.includes('back')) {
                return this.handleBrowseCourses(session, context);
            }
            if (input === '3' || input.includes('menu')) {
                const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
                return {
                    response: TemplateRegistry_1.TemplateRegistry.mainMenu(context.name || 'Menu', context.capabilities, storeUrl),
                    newState: types_1.BotState.MAIN_MENU,
                    updatedSession: session
                };
            }
            return {
                response: { text: "Reply with *1* to Enroll, *2* for back to Courses, or *3* for Main Menu." },
                newState: types_1.BotState.VIEWING_PRODUCT,
                updatedSession: session
            };
        });
    }
}
exports.InstituteEngine = InstituteEngine;
exports.instituteEngine = new InstituteEngine();
