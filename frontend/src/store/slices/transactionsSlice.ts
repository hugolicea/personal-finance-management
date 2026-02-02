import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import type { Transaction } from '../../types/transactions';

interface TransactionsState {
    transactions: Transaction[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: TransactionsState = {
    transactions: [],
    loading: false,
    deleting: false,
    error: null,
};

interface FetchTransactionsParams {
    transaction_type?: 'credit_card' | 'account';
    category?: string;
    search?: string;
    date_after?: string;
    date_before?: string;
    ordering?: string;
}

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async (params?: FetchTransactionsParams) => {
        const queryParams = new URLSearchParams();

        // Add pagination - fetch more records to handle larger datasets
        queryParams.append('page_size', '1000');

        if (params?.transaction_type) {
            queryParams.append('transaction_type', params.transaction_type);
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

        const response = await axios.get(
            `/api/v1/transactions/?${queryParams.toString()}`
        );
        return response.data.results || response.data;
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/createTransaction',
    async (transaction: Omit<Transaction, 'id'>) => {
        const response = await axios.post('/api/v1/transactions/', transaction);
        return response.data;
    }
);

export const updateTransaction = createAsyncThunk(
    'transactions/updateTransaction',
    async ({ id, ...transaction }: Partial<Transaction> & { id: number }) => {
        const response = await axios.put(
            `/api/v1/transactions/${id}/`,
            transaction
        );
        return response.data;
    }
);

export const deleteTransaction = createAsyncThunk(
    'transactions/deleteTransaction',
    async (id: number) => {
        await axios.delete(`/api/v1/transactions/${id}/`);
        return id;
    }
);

export const uploadBankStatement = createAsyncThunk(
    'transactions/uploadBankStatement',
    async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            '/api/v1/upload-bank-statement/',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }
);

const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {},
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
                    action.error.message || 'Failed to fetch transactions';
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
            })
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.deleting = false;
                state.transactions = state.transactions.filter(
                    (tx) => tx.id !== action.payload
                );
            })
            .addCase(deleteTransaction.rejected, (state) => {
                state.deleting = false;
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
                    action.error.message || 'Failed to upload bank statement';
            });
    },
});

export default transactionsSlice.reducer;
