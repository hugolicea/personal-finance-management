import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface Transaction {
    id: number;
    date: string;
    amount: string;
    description: string;
    category: number;
}

interface TransactionsState {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
}

const initialState: TransactionsState = {
    transactions: [],
    loading: false,
    error: null,
};

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async () => {
        const response = await axios.get('/api/transactions/');
        return response.data;
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/createTransaction',
    async (transaction: Omit<Transaction, 'id'>) => {
        const response = await axios.post('/api/transactions/', transaction);
        return response.data;
    }
);

export const updateTransaction = createAsyncThunk(
    'transactions/updateTransaction',
    async ({ id, ...transaction }: Partial<Transaction> & { id: number }) => {
        const response = await axios.put(
            `/api/transactions/${id}/`,
            transaction
        );
        return response.data;
    }
);

export const deleteTransaction = createAsyncThunk(
    'transactions/deleteTransaction',
    async (id: number) => {
        await axios.delete(`/api/transactions/${id}/`);
        return id;
    }
);

export const uploadBankStatement = createAsyncThunk(
    'transactions/uploadBankStatement',
    async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            '/api/upload-bank-statement/',
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
                state.transactions = action.payload;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message || 'Failed to fetch transactions';
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.transactions.push(action.payload);
            })
            .addCase(updateTransaction.fulfilled, (state, action) => {
                const index = state.transactions.findIndex(
                    (tx) => tx.id === action.payload.id
                );
                if (index !== -1) {
                    state.transactions[index] = action.payload;
                }
            })
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.transactions = state.transactions.filter(
                    (tx) => tx.id !== action.payload
                );
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
