import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import type {
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkReclassifyRequest,
    BulkReclassifyResponse,
    Transaction,
} from '../../types/transactions';
import type { RootState } from '..';
import apiClient from '../../utils/apiClient';

interface TransactionsState {
    transactions: Transaction[];
    _deletedCache?: Transaction[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: TransactionsState = {
    transactions: [],
    _deletedCache: [],
    loading: false,
    deleting: false,
    error: null,
};

interface FetchTransactionsParams {
    account?: number;
    category?: string;
    search?: string;
    date_after?: string;
    date_before?: string;
    ordering?: string;
}

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async (
        params: FetchTransactionsParams | undefined,
        { rejectWithValue }
    ) => {
        const queryParams = new URLSearchParams();

        // Add pagination - fetch more records to handle larger datasets
        queryParams.append('page_size', '1000');

        if (params?.account) {
            queryParams.append('account', String(params.account));
        }
        if (params?.category) {
            queryParams.append('category', params.category);
        }
        if (params?.search) {
            queryParams.append('search', params.search);
        }
        if (params?.date_after) {
            queryParams.append('date__gte', params.date_after);
        }
        if (params?.date_before) {
            queryParams.append('date__lte', params.date_before);
        }
        if (params?.ordering) {
            queryParams.append('ordering', params.ordering);
        }

        try {
            const response = await apiClient.get(
                `/api/v1/transactions/?${queryParams.toString()}`
            );
            return response.data.results || response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to fetch transactions'
                );
            }
            return rejectWithValue('Failed to fetch transactions');
        }
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/createTransaction',
    async (transaction: Omit<Transaction, 'id'>, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/transactions/',
                transaction
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to create transaction'
                );
            }
            return rejectWithValue('Failed to create transaction');
        }
    }
);

export const updateTransaction = createAsyncThunk(
    'transactions/updateTransaction',
    async (
        { id, ...transaction }: Partial<Transaction> & { id: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.patch(
                `/api/v1/transactions/${id}/`,
                transaction
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to update transaction'
                );
            }
            return rejectWithValue('Failed to update transaction');
        }
    }
);

export const deleteTransaction = createAsyncThunk(
    'transactions/deleteTransaction',
    async (id: number, { dispatch, getState, rejectWithValue }) => {
        const state = getState() as { transactions: TransactionsState };
        if (state.transactions.transactions.some((tx) => tx.id === id)) {
            dispatch(transactionsSlice.actions.optimisticDelete(id));
        }

        try {
            await apiClient.delete(`/api/v1/transactions/${id}/`);
            return id;
        } catch (err: unknown) {
            dispatch(transactionsSlice.actions.rollbackDelete(id));
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to delete transaction'
                );
            }
            return rejectWithValue('Failed to delete transaction');
        }
    }
);

export const uploadBankStatement = createAsyncThunk(
    'transactions/uploadBankStatement',
    async (
        { file, accountId }: { file: File; accountId?: number },
        { rejectWithValue }
    ) => {
        const formData = new FormData();
        formData.append('file', file);
        if (accountId !== undefined) {
            formData.append('account_id', String(accountId));
        }

        try {
            const response = await apiClient.post(
                '/api/v1/upload-bank-statement/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        err.response?.data?.error ??
                        'Failed to upload bank statement'
                );
            }
            return rejectWithValue('Failed to upload bank statement');
        }
    }
);

export const bulkReclassifyTransactions = createAsyncThunk(
    'transactions/bulkReclassify',
    async (request: BulkReclassifyRequest, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/bulk-reclassify-transactions/',
                request
            );
            return response.data as BulkReclassifyResponse;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to reclassify transactions'
                );
            }
            return rejectWithValue('Failed to reclassify transactions');
        }
    }
);

export const bulkDeleteTransactions = createAsyncThunk(
    'transactions/bulkDelete',
    async (request: BulkDeleteRequest, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/bulk-delete-transactions/',
                request
            );
            return response.data as BulkDeleteResponse;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to delete transactions'
                );
            }
            return rejectWithValue('Failed to delete transactions');
        }
    }
);

const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        optimisticDelete: (state, action: PayloadAction<number>) => {
            const removed = state.transactions.find(
                (transaction) => transaction.id === action.payload
            );

            if (!removed) {
                return;
            }

            state.transactions = state.transactions.filter(
                (transaction) => transaction.id !== action.payload
            );
            state._deletedCache = [...(state._deletedCache ?? []), removed];
        },
        rollbackDelete: (state, action: PayloadAction<number>) => {
            const deletedIndex = state._deletedCache?.findIndex(
                (transaction) => transaction.id === action.payload
            );

            if (deletedIndex === undefined || deletedIndex < 0) {
                return;
            }

            const [restored] = state._deletedCache!.splice(deletedIndex, 1);
            state.transactions.push(restored!);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload.map(
                    (transaction: {
                        id: number;
                        date: string;
                        amount: string | number;
                        description: string;
                        category: string | number;
                        transaction_type: string;
                    }) => ({
                        ...transaction,
                        amount:
                            typeof transaction.amount === 'string'
                                ? parseFloat(transaction.amount)
                                : transaction.amount,
                        category:
                            typeof transaction.category === 'string'
                                ? parseInt(transaction.category)
                                : transaction.category,
                    })
                );
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to fetch transactions';
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                const transaction = {
                    ...action.payload,
                    amount:
                        typeof action.payload.amount === 'string'
                            ? parseFloat(action.payload.amount)
                            : action.payload.amount,
                    category:
                        typeof action.payload.category === 'string'
                            ? parseInt(action.payload.category)
                            : action.payload.category,
                };
                state.transactions.push(transaction);
            })
            .addCase(updateTransaction.fulfilled, (state, action) => {
                const index = state.transactions.findIndex(
                    (tx) => tx.id === action.payload.id
                );
                if (index !== -1) {
                    state.transactions[index] = {
                        ...action.payload,
                        amount:
                            typeof action.payload.amount === 'string'
                                ? parseFloat(action.payload.amount)
                                : action.payload.amount,
                        category:
                            typeof action.payload.category === 'string'
                                ? parseInt(action.payload.category)
                                : action.payload.category,
                    };
                }
            })
            .addCase(deleteTransaction.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.deleting = false;
                state._deletedCache = (state._deletedCache ?? []).filter(
                    (transaction) => transaction.id !== action.payload
                );
            })
            .addCase(deleteTransaction.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to delete transaction';
            })
            .addCase(uploadBankStatement.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadBankStatement.fulfilled, (state) => {
                state.loading = false;
                // Refresh transactions after upload
                // The actual refresh will be handled by dispatching fetchTransactions
            })
            .addCase(uploadBankStatement.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to upload bank statement';
            })
            .addCase(bulkReclassifyTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(bulkReclassifyTransactions.fulfilled, (state) => {
                state.loading = false;
                // Transactions will be refreshed after reclassification
            })
            .addCase(bulkReclassifyTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to reclassify transactions';
            })
            .addCase(bulkDeleteTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(bulkDeleteTransactions.fulfilled, (state) => {
                state.loading = false;
                // Transactions will be refreshed after deletion
            })
            .addCase(bulkDeleteTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to delete transactions';
            });
    },
});

export const { optimisticDelete, rollbackDelete } = transactionsSlice.actions;

export const selectTransactions = (state: RootState) =>
    state.transactions.transactions;
export const selectTransactionsLoading = (state: RootState) =>
    state.transactions.loading;
export const selectTransactionsDeleting = (state: RootState) =>
    state.transactions.deleting;
export const selectTransactionsError = (state: RootState) =>
    state.transactions.error;

export default transactionsSlice.reducer;
