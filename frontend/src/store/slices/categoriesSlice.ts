import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import { Category, CategorySpending } from '../../types/categories';
import type { RootState } from '..';
import apiClient from '../../utils/apiClient';

interface CategoriesState {
    categories: Category[];
    _deletedCache?: Category[];
    categorySpending: CategorySpending[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: CategoriesState = {
    categories: [],
    _deletedCache: [],
    categorySpending: [],
    loading: false,
    deleting: false,
    error: null,
};

export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                '/api/v1/categories/?page_size=10000'
            );
            return response.data.results || response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to fetch categories'
                );
            }
            return rejectWithValue('Failed to fetch categories');
        }
    }
);

export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (
        data: {
            name: string;
            classification: string;
            monthly_budget: number;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.post('/api/v1/categories/', data);
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to create category'
                );
            }
            return rejectWithValue('Failed to create category');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'categories/updateCategory',
    async (
        {
            id,
            name,
            classification,
            monthly_budget,
        }: {
            id: number;
            name: string;
            classification: string;
            monthly_budget: number;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.put(`/api/v1/categories/${id}/`, {
                name,
                classification,
                monthly_budget,
            });
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to update category'
                );
            }
            return rejectWithValue('Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/deleteCategory',
    async (id: number, { dispatch, getState, rejectWithValue }) => {
        const state = getState() as { categories: CategoriesState };
        if (
            state.categories.categories.some((category) => category.id === id)
        ) {
            dispatch(categoriesSlice.actions.optimisticDelete(id));
        }

        try {
            await apiClient.delete(`/api/v1/categories/${id}/`);
            return id;
        } catch (err: unknown) {
            dispatch(categoriesSlice.actions.rollbackDelete(id));
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to delete category'
                );
            }
            return rejectWithValue('Failed to delete category');
        }
    }
);

export const fetchCategorySpending = createAsyncThunk(
    'categories/fetchCategorySpending',
    async (period: string, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                `/api/v1/category-spending/${period}/`
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to fetch category spending'
                );
            }
            return rejectWithValue('Failed to fetch category spending');
        }
    }
);

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        optimisticDelete: (state, action: PayloadAction<number>) => {
            const removed = state.categories.find(
                (category) => category.id === action.payload
            );

            if (!removed) {
                return;
            }

            state.categories = state.categories.filter(
                (category) => category.id !== action.payload
            );
            state._deletedCache = [...(state._deletedCache ?? []), removed];
        },
        rollbackDelete: (state, action: PayloadAction<number>) => {
            const deletedIndex = state._deletedCache?.findIndex(
                (category) => category.id === action.payload
            );

            if (deletedIndex === undefined || deletedIndex < 0) {
                return;
            }

            const [restored] = state._deletedCache!.splice(deletedIndex, 1);
            state.categories.push(restored!);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) || 'Failed to fetch categories';
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.push(action.payload);
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(
                    (cat) => cat.id === action.payload.id
                );
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(deleteCategory.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.deleting = false;
                state._deletedCache = (state._deletedCache ?? []).filter(
                    (category) => category.id !== action.payload
                );
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    (action.payload as string) || 'Failed to delete category';
            })
            .addCase(fetchCategorySpending.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategorySpending.fulfilled, (state, action) => {
                state.loading = false;
                state.categorySpending = action.payload.categories;
            })
            .addCase(fetchCategorySpending.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) ||
                    'Failed to fetch category spending';
            });
    },
});

export const { optimisticDelete, rollbackDelete } = categoriesSlice.actions;

export const selectCategories = (state: RootState) =>
    state.categories.categories;
export const selectCategoriesLoading = (state: RootState) =>
    state.categories.loading;
export const selectCategoriesDeleting = (state: RootState) =>
    state.categories.deleting;
export const selectCategoriesError = (state: RootState) =>
    state.categories.error;
export const selectCategorySpending = (state: RootState) =>
    state.categories.categorySpending;

export default categoriesSlice.reducer;
