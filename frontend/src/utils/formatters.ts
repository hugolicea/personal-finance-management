/**
 * Format a number as currency with commas for thousands separators
 * @param amount - The number to format
 * @returns Formatted string like "$1,234.56"
 */
export const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `$${formatted}`;
};

/**
 * Format a number with commas for thousands separators (without currency symbol)
 * @param amount - The number to format
 * @returns Formatted string like "1,234.56"
 */
export const formatNumber = (amount: number): string => {
    const absAmount = Math.abs(amount);
    return absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};
