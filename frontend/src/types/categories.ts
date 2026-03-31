export interface Category {
    id: number;
    name: string;
    classification: string;
    monthly_budget: number;
}

/** Shared identity fields for any category spending view */
interface CategorySpendingBase {
    id: number;
    name: string;
}

export interface CategorySpending extends CategorySpendingBase {
    budget: number;
    spending: number;
    balance: number;
    percentage_used: number;
}

export interface SpendingSummaryItem extends CategorySpendingBase {
    total_spent: number;
    budget_limit: number;
    percentage_used: number | null;
}

export interface SpendingSummaryResponse {
    month: string;
    categories: SpendingSummaryItem[];
}
