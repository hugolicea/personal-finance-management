import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface InvestmentApiResponse {
    id: number;
    symbol: string;
    name: string;
    investment_type: string;
    quantity: string;
    purchase_price: string;
    current_price: string | null;
    purchase_date: string;
    notes: string | null;
    total_invested: string;
    current_value: string;
    gain_loss: string;
    gain_loss_percentage: string;
    due_date: string | null;
}

interface Investment {
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
}

interface InvestmentsState {
    investments: Investment[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: InvestmentsState = {
    investments: [],
    loading: false,
    deleting: false,
    error: null,
};

export const fetchInvestments = createAsyncThunk(
    'investments/fetchInvestments',
    async () => {
        const response = await axios.get('/api/investments/');
        // Transform string fields to numbers with error handling
        return response.data.map((investment: InvestmentApiResponse) => ({
            ...investment,
            quantity: isNaN(parseFloat(investment.quantity))
                ? 0
                : parseFloat(investment.quantity),
            purchase_price: isNaN(parseFloat(investment.purchase_price))
                ? 0
                : parseFloat(investment.purchase_price),
            current_price:
                investment.current_price &&
                !isNaN(parseFloat(investment.current_price))
                    ? parseFloat(investment.current_price)
                    : null,
            total_invested: isNaN(parseFloat(investment.total_invested))
                ? 0
                : parseFloat(investment.total_invested),
            current_value: isNaN(parseFloat(investment.current_value))
                ? 0
                : parseFloat(investment.current_value),
            gain_loss: isNaN(parseFloat(investment.gain_loss))
                ? 0
                : parseFloat(investment.gain_loss),
            gain_loss_percentage: isNaN(
                parseFloat(investment.gain_loss_percentage)
            )
                ? 0
                : parseFloat(investment.gain_loss_percentage),
            principal_amount:
                investment.principal_amount &&
                !isNaN(parseFloat(investment.principal_amount))
                    ? parseFloat(investment.principal_amount)
                    : null,
            interest_rate:
                investment.interest_rate &&
                !isNaN(parseFloat(investment.interest_rate))
                    ? parseFloat(investment.interest_rate)
                    : null,
            term_years:
                investment.term_years &&
                !isNaN(parseFloat(investment.term_years))
                    ? parseFloat(investment.term_years)
                    : null,
        }));
    }
);

export const createInvestment = createAsyncThunk(
    'investments/createInvestment',
    async (data: {
        symbol: string;
        name: string;
        investment_type: string;
        quantity: number;
        purchase_price: number;
        current_price?: number;
        purchase_date: string;
        notes?: string;
        principal_amount?: number;
        interest_rate?: number;
        compounding_frequency?: string;
        term_years?: number;
    }) => {
        const response = await axios.post('/api/investments/', data);
        return response.data;
    }
);

export const updateInvestment = createAsyncThunk(
    'investments/updateInvestment',
    async ({ id, data }: { id: number; data: Partial<Investment> }) => {
        const response = await axios.patch(`/api/investments/${id}/`, data);
        return response.data;
    }
);

export const deleteInvestment = createAsyncThunk(
    'investments/deleteInvestment',
    async (id: number) => {
        await axios.delete(`/api/investments/${id}/`);
        return id;
    }
);

const investmentsSlice = createSlice({
    name: 'investments',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchInvestments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInvestments.fulfilled, (state, action) => {
                state.loading = false;
                state.investments = action.payload;
            })
            .addCase(fetchInvestments.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message || 'Failed to fetch investments';
            })
            .addCase(createInvestment.fulfilled, (state, action) => {
                state.investments.push(action.payload);
            })
            .addCase(updateInvestment.fulfilled, (state, action) => {
                const index = state.investments.findIndex(
                    (investment) => investment.id === action.payload.id
                );
                if (index !== -1) {
                    state.investments[index] = action.payload;
                }
            })
            .addCase(deleteInvestment.pending, (state) => {
                state.deleting = true;
            })
            .addCase(deleteInvestment.fulfilled, (state, action) => {
                state.deleting = false;
                state.investments = state.investments.filter(
                    (investment) => investment.id !== action.payload
                );
            })
            .addCase(deleteInvestment.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    action.error.message || 'Failed to delete investment';
            });
    },
});

export default investmentsSlice.reducer;
