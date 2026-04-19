export interface MonthlyIncomeExpense {
    month: string; // "YYYY-MM", e.g. "2026-01"
    income: number;
    expenses: number; // positive absolute value
    net: number;
}
