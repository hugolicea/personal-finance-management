/**
 * Convert a date string to YYYY-MM-DD format for date inputs, avoiding timezone issues
 * @param dateString - Date string in YYYY-MM-DD format or ISO format
 * @returns Date string in YYYY-MM-DD format (local timezone)
 */
export function toDateInputValue(dateString: string): string {
    if (!dateString) return '';

    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Parse the date and format as YYYY-MM-DD in local timezone
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display in local timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "2/15/2026")
 */
export function formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';

    // Parse as local date (not UTC) by adding time component
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;

    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString;

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString();
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * @returns Today's date as YYYY-MM-DD string
 */
export function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
