/**
 * Design System - Centralized theme constants
 * Provides consistent styling across the application
 */

export const colors = {
    // Brand colors
    primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Main green
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
    },

    // Neutral palette
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
    },

    // Status colors
    status: {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        dispatched: '#8b5cf6',
        completed: '#22c55e',
        cancelled: '#ef4444',
    }
} as const;

export const typography = {
    fontFamily: {
        sans: 'var(--font-geist-sans)',
        mono: 'var(--font-geist-mono)',
    },

    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem',// 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
        '6xl': '3.75rem', // 60px
    },

    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    }
} as const;

export const spacing = {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
} as const;

export const borderRadius = {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
} as const;

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const;

export const transitions = {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Business type configurations
export const businessTypes = {
    ecommerce: {
        label: 'E-commerce',
        color: colors.primary[600],
        icon: '🛍️',
    },
    service: {
        label: 'Service',
        color: colors.status.confirmed,
        icon: '💼',
    },
    institute: {
        label: 'Institute',
        color: colors.status.dispatched,
        icon: '🎓',
    },
} as const;
