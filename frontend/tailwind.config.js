/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Spacing System
            spacing: {
                section: '3rem', // 48px - Between major sections
                group: '1.5rem', // 24px - Between related groups
                item: '0.75rem', // 12px - Between individual items
                tight: '0.5rem', // 8px - Tight spacing
            },
            // Focus States (WCAG accessibility)
            ringWidth: {
                DEFAULT: '2px', // default ring width
            },
            ringOffsetWidth: {
                DEFAULT: '2px', // default ring offset
            },
            ringColor: {
                DEFAULT: 'hsl(var(--p))', // uses daisyUI primary color
            },
            // Semantic Chart Colors
            colors: {
                chart: {
                    expense: {
                        light: '#ef4444',
                        dark: '#b91c1c',
                    },
                    income: {
                        light: '#22c55e',
                        dark: '#15803d',
                    },
                    neutral: {
                        light: '#3b82f6',
                        dark: '#1d4ed8',
                    },
                },
            },
            // Tabular Numerals
            fontFamily: {
                sans: [
                    'ui-sans-serif',
                    'system-ui',
                    'sans-serif',
                    '"Apple Color Emoji"',
                    '"Segoe UI Emoji"',
                    '"Segoe UI Symbol"',
                    '"Noto Color Emoji"',
                ],
            },
        },
    },
    plugins: [daisyui],
    daisyui: {
        themes: [
            {
                light: {
                    primary: '#2563eb', // Standard blue
                    'primary-content': '#ffffff',
                    secondary: '#6366f1',
                    'secondary-content': '#ffffff',
                    accent: '#ef4444',
                    'accent-content': '#ffffff',
                    neutral: '#374151',
                    'neutral-content': '#ffffff',
                    'base-100': '#ffffff',
                    'base-200': '#f3f4f6',
                    'base-300': '#e5e7eb',
                    'base-content': '#111827', // WCAG AA text contrast
                    info: '#0284c7',
                    'info-content': '#ffffff',
                    success: '#16a34a',
                    'success-content': '#ffffff',
                    warning: '#d97706',
                    'warning-content': '#ffffff',
                    error: '#dc2626',
                    'error-content': '#ffffff',
                },
                dark: {
                    primary: '#1d4ed8', // Darker blue per requirements
                    'primary-content': '#ffffff',
                    secondary: '#4f46e5',
                    'secondary-content': '#ffffff',
                    accent: '#b91c1c',
                    'accent-content': '#ffffff',
                    neutral: '#1f2937',
                    'neutral-content': '#ffffff',
                    'base-100': '#111827',
                    'base-200': '#1f2937',
                    'base-300': '#374151',
                    'base-content': '#f9fafb', // WCAG AA text contrast
                    info: '#0369a1',
                    'info-content': '#ffffff',
                    success: '#15803d', // Darker green per requirements
                    'success-content': '#ffffff',
                    warning: '#b45309',
                    'warning-content': '#ffffff',
                    error: '#b91c1c', // Darker red per requirements
                    'error-content': '#ffffff',
                },
            },
        ],
    },
};
