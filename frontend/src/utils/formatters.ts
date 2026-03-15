/**
 * Format a number as currency with commas for thousands separators.
 * Always returns a positive value — callers are responsible for sign display
 * (e.g. passing Math.abs(amount), prefixing with '-', or using CSS colour).
 * @param amount - The number to format (sign is stripped)
 * @returns Formatted string like "$1,234.56" or "$0.00" for invalid values
 */
export const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) {
        return '$0.00';
    }
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `$${formatted}`;
};

/**
 * Format a number with commas for thousands separators (without currency symbol).
 * Always returns a positive value — callers are responsible for sign display.
 * @param amount - The number to format (sign is stripped)
 * @returns Formatted string like "1,234.56"
 */
export const formatNumber = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) {
        return '0.00';
    }
    const absAmount = Math.abs(amount);
    return absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};
