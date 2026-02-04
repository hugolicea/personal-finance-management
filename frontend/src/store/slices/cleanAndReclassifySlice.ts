import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import type {
    CategoryDeletionRule,
    ReclassificationRule,
} from '../../types/cleanAndReclassify';

interface CleanAndReclassifyState {
    reclassificationRules: ReclassificationRule[];
    categoryDeletionRules: CategoryDeletionRule[];
    loading: boolean;
    error: string | null;
}

const initialState: CleanAndReclassifyState = {
    reclassificationRules: [],
    categoryDeletionRules: [],
    loading: false,
    error: null,
};

// Reclassification Rules
export const fetchReclassificationRules = createAsyncThunk(
    'cleanAndReclassify/fetchReclassificationRules',
    async () => {
        const response = await axios.get('/api/v1/reclassification-rules/');
        return response.data.results || response.data;
    }
);

export const createReclassificationRule = createAsyncThunk(
    'cleanAndReclassify/createReclassificationRule',
    async (rule: { from_category: number; to_category: number }) => {
        const response = await axios.post(
            '/api/v1/reclassification-rules/',
            rule
        );
        return response.data;
    }
);

export const deleteReclassificationRule = createAsyncThunk(
    'cleanAndReclassify/deleteReclassificationRule',
    async (id: number) => {
        await axios.delete(`/api/v1/reclassification-rules/${id}/`);
        return id;
    }
);

// Category Deletion Rules
export const fetchCategoryDeletionRules = createAsyncThunk(
    'cleanAndReclassify/fetchCategoryDeletionRules',
    async () => {
        const response = await axios.get('/api/v1/category-deletion-rules/');
        return response.data.results || response.data;
    }
);

export const createCategoryDeletionRule = createAsyncThunk(
    'cleanAndReclassify/createCategoryDeletionRule',
    async (rule: { category: number }) => {
        const response = await axios.post(
            '/api/v1/category-deletion-rules/',
            rule
        );
        return response.data;
    }
);

export const deleteCategoryDeletionRule = createAsyncThunk(
    'cleanAndReclassify/deleteCategoryDeletionRule',
    async (id: number) => {
        await axios.delete(`/api/v1/category-deletion-rules/${id}/`);
        return id;
    }
);

const cleanAndReclassifySlice = createSlice({
    name: 'cleanAndReclassify',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Reclassification Rules
            .addCase(fetchReclassificationRules.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReclassificationRules.fulfilled, (state, action) => {
                state.loading = false;
                state.reclassificationRules = action.payload;
            })
            .addCase(fetchReclassificationRules.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message ||
                    'Failed to fetch reclassification rules';
            })
            // Create Reclassification Rule
            .addCase(createReclassificationRule.fulfilled, (state, action) => {
                state.reclassificationRules.push(action.payload);
            })
            // Delete Reclassification Rule
            .addCase(deleteReclassificationRule.fulfilled, (state, action) => {
                state.reclassificationRules =
                    state.reclassificationRules.filter(
                        (rule) => rule.id !== action.payload
                    );
            })
            // Fetch Category Deletion Rules
            .addCase(fetchCategoryDeletionRules.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategoryDeletionRules.fulfilled, (state, action) => {
                state.loading = false;
                state.categoryDeletionRules = action.payload;
            })
            .addCase(fetchCategoryDeletionRules.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message || 'Failed to fetch deletion rules';
            })
            // Create Category Deletion Rule
            .addCase(createCategoryDeletionRule.fulfilled, (state, action) => {
                state.categoryDeletionRules.push(action.payload);
            })
            // Delete Category Deletion Rule
            .addCase(deleteCategoryDeletionRule.fulfilled, (state, action) => {
                state.categoryDeletionRules =
                    state.categoryDeletionRules.filter(
                        (rule) => rule.id !== action.payload
                    );
            });
    },
});

export default cleanAndReclassifySlice.reducer;
