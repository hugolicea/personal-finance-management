export type AccountType =
    | 'checking'
    | 'savings'
    | 'credit_card'
    | 'cash'
    | 'investment'
    | 'other';

export interface BankAccount {
    id: number;
    user: number;
    name: string;
    account_type: AccountType;
    institution: string;
    account_number: string | null;
    currency: string;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    transaction_count: number;
    total_balance: number;
    current_month_count: number;
    current_month_balance: number;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit_card: 'Credit Card',
    cash: 'Cash',
    investment: 'Investment',
    other: 'Other',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
    checking: '🏦',
    savings: '🏧',
    credit_card: '💳',
    cash: '💵',
    investment: '📈',
    other: '🏛️',
};
