export interface ReclassificationConditions {
    description_contains?: string[];
    description_not_contains?: string[];
    amount_min?: number;
    amount_max?: number;
    date_from?: string;
    date_to?: string;
    transaction_type?: 'income' | 'expense';
}

export interface ReclassificationRule {
    id: number;
    from_category: number | null;
    to_category: number;
    from_category_name: string;
    to_category_name: string;
    conditions?: ReclassificationConditions;
    rule_name?: string;
    created_at: string;
    is_active: boolean;
}

export interface CreateReclassificationRulePayload {
    from_category?: number | null;
    to_category: number;
    conditions?: ReclassificationConditions;
    rule_name?: string;
}

export interface CategoryDeletionRule {
    id: number;
    category: number;
    category_name: string;
    created_at: string;
    is_active: boolean;
}
