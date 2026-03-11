import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface BackupState {
    loading: boolean;
    error: string | null;
    restoreResult: RestoreResult | null;
}

export interface RestoreResult {
    message: string;
    summary: {
        categories: number;
        transactions: number;
        investments: number;
        heritages: number;
        retirement_accounts: number;
        reclassification_rules: number;
        category_deletion_rules: number;
    };
}

const initialState: BackupState = {
    loading: false,
    error: null,
    restoreResult: null,
};

export const downloadBackup = createAsyncThunk(
    'backup/download',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/v1/backup/', {
                responseType: 'blob',
            });
            const contentDisposition =
                response.headers['content-disposition'] ?? '';
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            const filename = match ? match[1] : 'backup.json';

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.error ?? 'Failed to download backup'
                );
            }
            return rejectWithValue('Failed to download backup');
        }
    }
);

export const restoreBackup = createAsyncThunk(
    'backup/restore',
    async (
        { file, replaceExisting }: { file: File; replaceExisting: boolean },
        { rejectWithValue }
    ) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append(
                'replace_existing',
                replaceExisting ? 'true' : 'false'
            );
            const response = await axios.post('/api/v1/restore/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data as RestoreResult;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.error ?? 'Failed to restore backup'
                );
            }
            return rejectWithValue('Failed to restore backup');
        }
    }
);

const backupSlice = createSlice({
    name: 'backup',
    initialState,
    reducers: {
        clearRestoreResult(state) {
            state.restoreResult = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(downloadBackup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(downloadBackup.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(downloadBackup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(restoreBackup.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.restoreResult = null;
            })
            .addCase(restoreBackup.fulfilled, (state, action) => {
                state.loading = false;
                state.restoreResult = action.payload;
            })
            .addCase(restoreBackup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearRestoreResult } = backupSlice.actions;
export default backupSlice.reducer;
