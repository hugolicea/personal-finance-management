export interface ReclassificationRule {
    id: number;
    from_category: number;
    to_category: number;
    from_category_name: string;
    to_category_name: string;
    created_at: string;
    is_active: boolean;
}

export interface CategoryDeletionRule {
    id: number;
    category: number;
    category_name: string;
    created_at: string;
    is_active: boolean;
}
