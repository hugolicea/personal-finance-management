/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {},
    },
    plugins: [daisyui],
    daisyui: {
        themes: [
            {
                pfm: {
                    primary: '#2563eb',
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
                    'base-content': '#111827',
                    info: '#0284c7',
                    'info-content': '#ffffff',
                    success: '#16a34a',
                    'success-content': '#ffffff',
                    warning: '#d97706',
                    'warning-content': '#ffffff',
                    error: '#dc2626',
                    'error-content': '#ffffff',
                },
            },
        ],
    },
};
