import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import { Category, CategorySpending } from '../../types/categories';

interface CategoriesState {
    categories: Category[];
    categorySpending: CategorySpending[];
    loading: boolean;
    error: string | null;
}

const initialState: CategoriesState = {
    categories: [],
    categorySpending: [],
    loading: false,
    error: null,
};

export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async () => {
        const response = await axios.get('/api/v1/categories/?page_size=10000');
        return response.data.results || response.data;
    }
);

export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (data: {
        name: string;
        classification: string;
        monthly_budget: number;
    }) => {
        const response = await axios.post('/api/v1/categories/', data);
        return response.data;
    }
);

export const updateCategory = createAsyncThunk(
    'categories/updateCategory',
    async ({
        id,
        name,
        classification,
        monthly_budget,
    }: {
        id: number;
        name: string;
        classification: string;
        monthly_budget: number;
    }) => {
        const response = await axios.put(`/api/v1/categories/${id}/`, {
            name,
            classification,
            monthly_budget,
        });
        return response.data;
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/deleteCategory',
    async (id: number) => {
        await axios.delete(`/api/v1/categories/${id}/`);
        return id;
    }
);

export const fetchCategorySpending = createAsyncThunk(
    'categories/fetchCategorySpending',
    async (period: string) => {
        const response = await axios.get(
            `/api/v1/category-spending/${period}/`
        );
        return response.data;
    }
);

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
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
                    action.error.message || 'Failed to fetch categories';
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
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(
                    (cat) => cat.id !== action.payload
                );
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
                    action.error.message || 'Failed to fetch category spending';
            });
    },
});

export default categoriesSlice.reducer;
