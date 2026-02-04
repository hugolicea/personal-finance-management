export interface Transaction {
    id: number;
    date: string;
    amount: number;
    description: string;
    category: number;
    transaction_type: string;
}

export interface BulkReclassifyRequest {
    from_category_id: number;
    to_category_id: number;
}

export interface BulkReclassifyResponse {
    message: string;
    transactions_updated: number;
    from_category: string;
    to_category: string;
}

export interface BulkDeleteRequest {
    category_ids: number[];
}

export interface BulkDeleteResponse {
    message: string;
    transactions_deleted: number;
    categories_processed: string[];
}
