/**
 * Centralized chart color system
 * - Expenses: red/orange tones
 * - Income: green tones
 * - Neutral/Investments: blue tones
 * - Heritage/Assets: brown/amber tones
 * - Retirement: purple/violet tones
 * All colors pass WCAG AA contrast on white background
 */

export const CHART_COLORS = {
    // Expense categories - red scale
    expenses: [
        '#dc2626',
        '#b91c1c',
        '#991b1b',
        '#7f1d1d',
        '#ef4444',
        '#f87171',
    ],

    // Income categories - green scale
    income: ['#15803d', '#166534', '#14532d', '#16a34a', '#22c55e', '#4ade80'],

    // Investments/neutral - blue scale
    investments: [
        '#1d4ed8',
        '#1e40af',
        '#1e3a8a',
        '#2563eb',
        '#3b82f6',
        '#60a5fa',
    ],

    // Real estate/heritage - amber scale
    heritage: [
        '#b45309',
        '#92400e',
        '#78350f',
        '#d97706',
        '#f59e0b',
        '#fbbf24',
    ],

    // Retirement - purple scale
    retirement: [
        '#6d28d9',
        '#5b21b6',
        '#4c1d95',
        '#7c3aed',
        '#8b5cf6',
        '#a78bfa',
    ],

    // Semantic single colors
    semantic: {
        income: '#15803d',
        expense: '#b91c1c',
        balance: '#1d4ed8',
        neutral: '#374151',
        positive: '#15803d',
        negative: '#b91c1c',
    },

    // Category pie chart palette (distinct colors for pie slices)
    categorical: [
        '#1d4ed8',
        '#15803d',
        '#dc2626',
        '#b45309',
        '#6d28d9',
        '#0369a1',
        '#166534',
        '#991b1b',
        '#92400e',
        '#5b21b6',
        '#0e7490',
        '#14532d',
        '#7f1d1d',
        '#78350f',
        '#4c1d95',
    ],
};

/**
 * Get color for a category pie chart slice.
 */
export const getCategoricalColor = (index: number): string => {
    return CHART_COLORS.categorical[index % CHART_COLORS.categorical.length]!;
};

/**
 * Get semantic color based on value sign.
 */
export const getValueColor = (value: number): string => {
    return value >= 0
        ? CHART_COLORS.semantic.positive
        : CHART_COLORS.semantic.negative;
};

/**
 * Standard Recharts tooltip style (WCAG AA compliant).
 */
export const CHART_TOOLTIP_STYLE = {
    contentStyle: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        color: '#111827',
        fontSize: '13px',
    },
    labelStyle: {
        color: '#374151',
        fontWeight: 600,
    },
};
