import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import type { BankAccount } from '../../types/accounts';
import apiClient from '../../utils/apiClient';
import { getCurrentMonthStr } from '../../utils/dateHelpers';
import type { RootState } from '../index';

interface AccountsState {
    accounts: BankAccount[];
    _deletedCache: BankAccount[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: AccountsState = {
    accounts: [],
    _deletedCache: [],
    loading: false,
    deleting: false,
    error: null,
};

export const fetchAccounts = createAsyncThunk(
    'accounts/fetchAccounts',
    async (_, { rejectWithValue }) => {
        try {
            const month = getCurrentMonthStr();
            const response = await apiClient.get('/api/v1/bank-accounts/', {
                params: { page_size: 10000, month },
            });
            return response.data.results || response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to load accounts'
                );
            }
            return rejectWithValue('Failed to load accounts');
        }
    }
);

export const createAccount = createAsyncThunk(
    'accounts/createAccount',
    async (
        data: {
            name: string;
            account_type: string;
            institution?: string;
            currency?: string;
            notes?: string;
            is_active?: boolean;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.post(
                '/api/v1/bank-accounts/',
                data
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to create account'
                );
            }
            return rejectWithValue('Failed to create account');
        }
    }
);

export const updateAccount = createAsyncThunk(
    'accounts/updateAccount',
    async (
        { id, ...data }: Partial<BankAccount> & { id: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.put(
                `/api/v1/bank-accounts/${id}/`,
                data
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to update account'
                );
            }
            return rejectWithValue('Failed to update account');
        }
    }
);

export const deleteAccount = createAsyncThunk(
    'accounts/deleteAccount',
    async (id: number, { dispatch, rejectWithValue }) => {
        dispatch(optimisticDelete(id));
        try {
            await apiClient.delete(`/api/v1/bank-accounts/${id}/`);
            return id;
        } catch (err: unknown) {
            dispatch(rollbackDelete(id));
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to delete account'
                );
            }
            return rejectWithValue('Failed to delete account');
        }
    }
);

const accountsSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {
        optimisticDelete(state, action: PayloadAction<number>) {
            const index = state.accounts.findIndex(
                (account) => account.id === action.payload
            );
            if (index === -1) {
                return;
            }

            const [deletedAccount] = state.accounts.splice(index, 1);
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
            state.accounts.push(restoredAccount!);
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchAccounts
            .addCase(fetchAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAccounts.fulfilled, (state, action) => {
                state.loading = false;
                state.accounts = action.payload;
            })
            .addCase(fetchAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) ?? 'Failed to load accounts';
            })
            // createAccount
            .addCase(createAccount.fulfilled, (state, action) => {
                state.accounts.push(action.payload);
            })
            // updateAccount
            .addCase(updateAccount.fulfilled, (state, action) => {
                const idx = state.accounts.findIndex(
                    (a) => a.id === action.payload.id
                );
                if (idx !== -1) state.accounts[idx] = action.payload;
            })
            // deleteAccount
            .addCase(deleteAccount.pending, (state) => {
                state.deleting = true;
            })
            .addCase(deleteAccount.fulfilled, (state, action) => {
                state.deleting = false;
                state.accounts = state.accounts.filter(
                    (a) => a.id !== action.payload
                );
                state._deletedCache = state._deletedCache.filter(
                    (a) => a.id !== action.payload
                );
            })
            .addCase(deleteAccount.rejected, (state) => {
                state.deleting = false;
            });
    },
});

export const { optimisticDelete, rollbackDelete } = accountsSlice.actions;

export const selectTotalBalance = (state: RootState): number =>
    state.accounts.accounts
        .filter((a) => a.account_type !== 'credit_card')
        .reduce((sum, a) => sum + (a.total_balance || 0), 0);

export default accountsSlice.reducer;
