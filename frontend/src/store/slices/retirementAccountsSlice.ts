import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface RetirementAccount {
    id: number;
    name: string;
    account_type: string;
    provider: string;
    account_number: string | null;
    current_balance: number;
    monthly_contribution: number;
    employer_match_percentage: number;
    employer_match_limit: number;
    risk_level: string;
    target_retirement_age: number;
    notes: string | null;
    annual_contribution: number;
    employer_match_amount: number;
    total_annual_contribution: number;
}

interface RetirementAccountsState {
    retirementAccounts: RetirementAccount[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: RetirementAccountsState = {
    retirementAccounts: [],
    loading: false,
    deleting: false,
    error: null,
};

export const fetchRetirementAccounts = createAsyncThunk(
    'retirementAccounts/fetchRetirementAccounts',
    async () => {
        const response = await axios.get('/api/retirement-accounts/');
        return response.data;
    }
);

export const createRetirementAccount = createAsyncThunk(
    'retirementAccounts/createRetirementAccount',
    async (data: {
        name: string;
        account_type: string;
        provider: string;
        account_number?: string;
        current_balance?: number;
        monthly_contribution?: number;
        employer_match_percentage?: number;
        employer_match_limit?: number;
        risk_level?: string;
        target_retirement_age?: number;
        notes?: string;
    }) => {
        const response = await axios.post('/api/retirement-accounts/', data);
        return response.data;
    }
);

export const updateRetirementAccount = createAsyncThunk(
    'retirementAccounts/updateRetirementAccount',
    async ({ id, data }: { id: number; data: Partial<RetirementAccount> }) => {
        const response = await axios.patch(
            `/api/retirement-accounts/${id}/`,
            data
        );
        return response.data;
    }
);

export const deleteRetirementAccount = createAsyncThunk(
    'retirementAccounts/deleteRetirementAccount',
    async (id: number) => {
        await axios.delete(`/api/retirement-accounts/${id}/`);
        return id;
    }
);

const retirementAccountsSlice = createSlice({
    name: 'retirementAccounts',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRetirementAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRetirementAccounts.fulfilled, (state, action) => {
                state.loading = false;
                state.retirementAccounts = action.payload;
            })
            .addCase(fetchRetirementAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message ||
                    'Failed to fetch retirement accounts';
            })
            .addCase(createRetirementAccount.fulfilled, (state, action) => {
                state.retirementAccounts.push(action.payload);
            })
            .addCase(updateRetirementAccount.fulfilled, (state, action) => {
                const index = state.retirementAccounts.findIndex(
                    (account) => account.id === action.payload.id
                );
                if (index !== -1) {
                    state.retirementAccounts[index] = action.payload;
                }
            })
            .addCase(deleteRetirementAccount.pending, (state) => {
                state.deleting = true;
            })
            .addCase(deleteRetirementAccount.fulfilled, (state, action) => {
                state.deleting = false;
                state.retirementAccounts = state.retirementAccounts.filter(
                    (account) => account.id !== action.payload
                );
            })
            .addCase(deleteRetirementAccount.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    action.error.message ||
                    'Failed to delete retirement account';
            });
    },
});

export default retirementAccountsSlice.reducer;
