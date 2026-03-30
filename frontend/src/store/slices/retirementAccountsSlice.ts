import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import apiClient from '../../utils/apiClient';
import type { RootState } from '../index';

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
    created_at?: string | null;
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
    created_at?: string | null;
}

interface RetirementAccountsState {
    retirementAccounts: RetirementAccount[];
    _deletedCache: RetirementAccount[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: RetirementAccountsState = {
    retirementAccounts: [],
    _deletedCache: [],
    loading: false,
    deleting: false,
    error: null,
};

function parseRetirementAccount(
    raw: RetirementAccountApiResponse
): RetirementAccount {
    return {
        ...raw,
        current_balance: parseFloat(raw.current_balance) || 0,
        monthly_contribution: parseFloat(raw.monthly_contribution) || 0,
        employer_match_percentage:
            parseFloat(raw.employer_match_percentage) || 0,
        employer_match_limit: parseFloat(raw.employer_match_limit) || 0,
        target_retirement_age: parseInt(raw.target_retirement_age) || 65,
        annual_contribution: parseFloat(raw.annual_contribution) || 0,
        employer_match_amount: parseFloat(raw.employer_match_amount) || 0,
        total_annual_contribution:
            parseFloat(raw.total_annual_contribution) || 0,
    };
}

export const fetchRetirementAccounts = createAsyncThunk(
    'retirementAccounts/fetchRetirementAccounts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                '/api/v1/retirement-accounts/?page_size=10000'
            );
            const data = response.data.results || response.data;
            return (data as RetirementAccountApiResponse[]).map(
                parseRetirementAccount
            );
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to fetch retirement accounts'
                );
            }
            return rejectWithValue('Failed to fetch retirement accounts');
        }
    }
);

export const createRetirementAccount = createAsyncThunk(
    'retirementAccounts/createRetirementAccount',
    async (
        data: {
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
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.post(
                '/api/v1/retirement-accounts/',
                data
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to create retirement account'
                );
            }
            return rejectWithValue('Failed to create retirement account');
        }
    }
);

export const updateRetirementAccount = createAsyncThunk(
    'retirementAccounts/updateRetirementAccount',
    async (
        { id, data }: { id: number; data: Partial<RetirementAccount> },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.patch(
                `/api/v1/retirement-accounts/${id}/`,
                data
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to update retirement account'
                );
            }
            return rejectWithValue('Failed to update retirement account');
        }
    }
);

export const deleteRetirementAccount = createAsyncThunk(
    'retirementAccounts/deleteRetirementAccount',
    async (id: number, { dispatch, rejectWithValue }) => {
        dispatch(optimisticDelete(id));
        try {
            await apiClient.delete(`/api/v1/retirement-accounts/${id}/`);
            return id;
        } catch (err: unknown) {
            dispatch(rollbackDelete(id));
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to delete retirement account'
                );
            }
            return rejectWithValue('Failed to delete retirement account');
        }
    }
);

const retirementAccountsSlice = createSlice({
    name: 'retirementAccounts',
    initialState,
    reducers: {
        optimisticDelete(state, action: PayloadAction<number>) {
            const index = state.retirementAccounts.findIndex(
                (account) => account.id === action.payload
            );
            if (index === -1) {
                return;
            }

            const [deletedAccount] = state.retirementAccounts.splice(index, 1);
            state._deletedCache.push(deletedAccount!);
        },
        rollbackDelete(state, action: PayloadAction<number>) {
            const cachedIndex = state._deletedCache.findIndex(
                (account) => account.id === action.payload
            );
            if (cachedIndex === -1) {
                return;
            }

            const [restoredAccount] = state._deletedCache.splice(
                cachedIndex,
                1
            );
            state.retirementAccounts.push(restoredAccount!);
        },
    },
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
                    (action.payload as string) ||
                    'Failed to fetch retirement accounts';
            })
            .addCase(createRetirementAccount.fulfilled, (state, action) => {
                state.retirementAccounts.push(
                    parseRetirementAccount(
                        action.payload as RetirementAccountApiResponse
                    )
                );
            })
            .addCase(updateRetirementAccount.fulfilled, (state, action) => {
                const index = state.retirementAccounts.findIndex(
                    (account) => account.id === action.payload.id
                );
                if (index !== -1) {
                    state.retirementAccounts[index] = parseRetirementAccount(
                        action.payload as RetirementAccountApiResponse
                    );
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
                state._deletedCache = state._deletedCache.filter(
                    (account) => account.id !== action.payload
                );
            })
            .addCase(deleteRetirementAccount.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to delete retirement account';
            });
    },
});

export const { optimisticDelete, rollbackDelete } =
    retirementAccountsSlice.actions;

export const selectRetirementValue = (state: RootState): number =>
    state.retirementAccounts.retirementAccounts.reduce(
        (sum, a) => sum + (a.current_balance || 0),
        0
    );

export default retirementAccountsSlice.reducer;
