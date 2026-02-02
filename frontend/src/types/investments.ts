export interface Investment {
    id: number;
    symbol: string;
    name: string;
    investment_type: string;
    quantity: number;
    purchase_price: number;
    current_price: number | null;
    purchase_date: string;
    notes: string | null;
    total_invested: number;
    current_value: number;
    gain_loss: number;
    gain_loss_percentage: number;
    due_date: string | null;

    // Fixed-income related fields
    principal_amount: number | null;
    interest_rate: number | null;
    compounding_frequency: string | null;
    term_years: number | null;
}
