import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface RetirementAccountApiResponse {
    id: number;
    name: string;
    account_type: string;
    provider: string;
    account_number: string | null;
    current_balance: string;
    monthly_contribution: string;
    employer_match_percentage: string;
    employer_match_limit: string;
    risk_level: string;
    target_retirement_age: string;
    notes: string | null;
    annual_contribution: string;
    employer_match_amount: string;
    total_annual_contribution: string;
}

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
        const response = await axios.get(
            '/api/v1/retirement-accounts/?page_size=10000'
        );
        const data = response.data.results || response.data;
        // Transform string fields to numbers with error handling
        return data.map((account: RetirementAccountApiResponse) => ({
            ...account,
            current_balance: isNaN(parseFloat(account.current_balance))
                ? 0
                : parseFloat(account.current_balance),
            monthly_contribution: isNaN(
                parseFloat(account.monthly_contribution)
            )
                ? 0
                : parseFloat(account.monthly_contribution),
            employer_match_percentage: isNaN(
                parseFloat(account.employer_match_percentage)
            )
                ? 0
                : parseFloat(account.employer_match_percentage),
            employer_match_limit: isNaN(
                parseFloat(account.employer_match_limit)
            )
                ? 0
                : parseFloat(account.employer_match_limit),
            target_retirement_age: isNaN(
                parseInt(account.target_retirement_age)
            )
                ? 65
                : parseInt(account.target_retirement_age),
            annual_contribution: isNaN(parseFloat(account.annual_contribution))
                ? 0
                : parseFloat(account.annual_contribution),
            employer_match_amount: isNaN(
                parseFloat(account.employer_match_amount)
            )
                ? 0
                : parseFloat(account.employer_match_amount),
            total_annual_contribution: isNaN(
                parseFloat(account.total_annual_contribution)
            )
                ? 0
                : parseFloat(account.total_annual_contribution),
        }));
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
        const response = await axios.post('/api/v1/retirement-accounts/', data);
        return response.data;
    }
);

export const updateRetirementAccount = createAsyncThunk(
    'retirementAccounts/updateRetirementAccount',
    async ({ id, data }: { id: number; data: Partial<RetirementAccount> }) => {
        const response = await axios.patch(
            `/api/v1/retirement-accounts/${id}/`,
            data
        );
        return response.data;
    }
);

export const deleteRetirementAccount = createAsyncThunk(
    'retirementAccounts/deleteRetirementAccount',
    async (id: number) => {
        await axios.delete(`/api/v1/retirement-accounts/${id}/`);
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
