export interface Category {
    id: number;
    name: string;
    classification: string;
    monthly_budget: number;
}

export interface CategorySpending {
    id: number;
    name: string;
    budget: number;
    spending: number;
    balance: number;
    percentage_used: number;
}
