export interface Heritage {
    id: number;
    name: string;
    heritage_type: string;
    address: string;
    area: number | null;
    area_unit: string;
    purchase_price: number;
    current_value: number | null;
    purchase_date: string;
    monthly_rental_income: number;
    notes: string | null;
    gain_loss: number;
    gain_loss_percentage: number;
    annual_rental_income: number;
    rental_yield_percentage: number;
}
