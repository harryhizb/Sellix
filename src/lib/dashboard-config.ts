import {
    ShoppingBag,
    Package,
    BarChart3,
    MessageSquare,
    Settings,
    Calendar,
    Briefcase,
    Clock,
    GraduationCap,
    CalendarDays,
    UserCheck,
    BookOpen,
    Link2,
    Store,
    ExternalLink,
    Tag,
} from 'lucide-react';

export interface Capabilities {
    supportsProducts: boolean;
    supportsServices: boolean;
    supportsBooking: boolean;
    supportsCart: boolean;
    supportsInformation: boolean;
}

export interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: string;
}

export function getNavigation(capabilities: Capabilities): NavItem[] {
    const items: NavItem[] = [
        { label: 'Overview', href: '/dashboard', icon: BarChart3 },
    ];

    // Commerce features
    if (capabilities.supportsProducts || capabilities.supportsCart) {
        items.push({ label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag });
        items.push({ label: 'Products', href: '/dashboard/products', icon: Package });
        items.push({ label: 'Categories', href: '/dashboard/categories', icon: Tag });
        items.push({ label: 'Storefront', href: '/dashboard/storefront', icon: Store });
    }

    // Service features
    if (capabilities.supportsServices || capabilities.supportsBooking) {
        items.push({ label: 'Appointments', href: '/dashboard/appointments', icon: Calendar });
        items.push({ label: 'Services', href: '/dashboard/services', icon: Briefcase });
        items.push({ label: 'Schedule', href: '/dashboard/schedule', icon: Clock });
    }

    // Informational features
    if (capabilities.supportsInformation) {
        items.push({ label: 'Events', href: '/dashboard/events', icon: CalendarDays });
        items.push({ label: 'Courses', href: '/dashboard/courses', icon: BookOpen });
        items.push({ label: 'Registrations', href: '/dashboard/registrations', icon: UserCheck });
        items.push({ label: 'Knowledge Base', href: '/dashboard/faqs', icon: GraduationCap });
    }

    // Always present
    items.push({ label: 'Connection', href: '/dashboard/connection', icon: Link2 });
    items.push({ label: 'Chat', href: '/dashboard/chat', icon: MessageSquare });
    items.push({ label: 'Settings', href: '/dashboard/settings', icon: Settings });

    return items;
}