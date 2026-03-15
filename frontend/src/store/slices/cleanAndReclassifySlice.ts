import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import type {
    CategoryDeletionRule,
    CreateReclassificationRulePayload,
    ReclassificationRule,
} from '../../types/cleanAndReclassify';
import apiClient from '../../utils/apiClient';

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
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                '/api/v1/reclassification-rules/'
            );
            return response.data.results || response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to fetch reclassification rules'
                );
            }
            return rejectWithValue('Failed to fetch reclassification rules');
        }
    }
);

export const createReclassificationRule = createAsyncThunk(
    'cleanAndReclassify/createReclassificationRule',
    async (rule: CreateReclassificationRulePayload, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/reclassification-rules/',
                rule
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to create reclassification rule'
                );
            }
            return rejectWithValue('Failed to create reclassification rule');
        }
    }
);

export const previewReclassificationRule = createAsyncThunk(
    'cleanAndReclassify/previewReclassificationRule',
    async (ruleId: number, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/preview-reclassification-rule/',
                { rule_id: ruleId }
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to preview rule'
                );
            }
            return rejectWithValue('Failed to preview rule');
        }
    }
);

export const bulkExecuteReclassificationRules = createAsyncThunk(
    'cleanAndReclassify/bulkExecuteReclassificationRules',
    async (ruleIds: number[], { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/bulk-execute-reclassification-rules/',
                { rule_ids: ruleIds }
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to execute rules'
                );
            }
            return rejectWithValue('Failed to execute rules');
        }
    }
);

export const deleteReclassificationRule = createAsyncThunk(
    'cleanAndReclassify/deleteReclassificationRule',
    async (id: number, { rejectWithValue }) => {
        try {
            await apiClient.delete(`/api/v1/reclassification-rules/${id}/`);
            return id;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to delete reclassification rule'
                );
            }
            return rejectWithValue('Failed to delete reclassification rule');
        }
    }
);

// Category Deletion Rules
export const fetchCategoryDeletionRules = createAsyncThunk(
    'cleanAndReclassify/fetchCategoryDeletionRules',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                '/api/v1/category-deletion-rules/'
            );
            return response.data.results || response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to fetch deletion rules'
                );
            }
            return rejectWithValue('Failed to fetch deletion rules');
        }
    }
);

export const createCategoryDeletionRule = createAsyncThunk(
    'cleanAndReclassify/createCategoryDeletionRule',
    async (rule: { category: number }, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/category-deletion-rules/',
                rule
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to create deletion rule'
                );
            }
            return rejectWithValue('Failed to create deletion rule');
        }
    }
);

export const deleteCategoryDeletionRule = createAsyncThunk(
    'cleanAndReclassify/deleteCategoryDeletionRule',
    async (id: number, { rejectWithValue }) => {
        try {
            await apiClient.delete(`/api/v1/category-deletion-rules/${id}/`);
            return id;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ??
                        'Failed to delete deletion rule'
                );
            }
            return rejectWithValue('Failed to delete deletion rule');
        }
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
                    (action.payload as string) ||
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
            // Preview Reclassification Rule
            .addCase(previewReclassificationRule.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(previewReclassificationRule.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(previewReclassificationRule.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) || 'Failed to preview rule';
            })
            // Bulk Execute Reclassification Rules
            .addCase(bulkExecuteReclassificationRules.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(bulkExecuteReclassificationRules.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(
                bulkExecuteReclassificationRules.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        (action.payload as string) || 'Failed to execute rules';
                }
            )
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
                    (action.payload as string) ||
                    'Failed to fetch deletion rules';
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
