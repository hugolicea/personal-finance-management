import {
    createAsyncThunk,
    createSelector,
    createSlice,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import type { RootState } from '..';
import type {
    SpendingSummaryItem,
    SpendingSummaryResponse,
} from '../../types/categories';
import apiClient from '../../utils/apiClient';

interface BudgetProgressState {
    month: string;
    categories: SpendingSummaryItem[];
    loading: boolean;
    error: string | null;
}

const initialState: BudgetProgressState = {
    month: '',
    categories: [],
    loading: false,
    error: null,
};

export const fetchSpendingSummary = createAsyncThunk<
    SpendingSummaryResponse,
    void,
    { rejectValue: string }
>('budgetProgress/fetchSpendingSummary', async (_, { rejectWithValue }) => {
    try {
        const response = await apiClient.get('/api/v1/spending-summary/');
        return response.data;
    } catch (err: unknown) {
        if (isAxiosError(err)) {
            return rejectWithValue(
                err.response?.data?.detail ?? 'Failed to fetch spending summary'
            );
        }
        return rejectWithValue('Failed to fetch spending summary');
    }
});

const budgetProgressSlice = createSlice({
    name: 'budgetProgress',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSpendingSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSpendingSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.month = action.payload.month;
                state.categories = action.payload.categories;
            })
            .addCase(fetchSpendingSummary.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload ?? 'Failed to fetch spending summary';
            });
    },
});

export const selectSpendingSummary = createSelector(
    (state: RootState) => state.budgetProgress.month,
    (state: RootState) => state.budgetProgress.categories,
    (month, categories) => ({ month, categories })
);
export const selectBudgetProgressLoading = (state: RootState) =>
    state.budgetProgress.loading;
export const selectBudgetProgressError = (state: RootState) =>
    state.budgetProgress.error;

export default budgetProgressSlice.reducer;
