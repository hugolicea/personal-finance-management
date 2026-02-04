import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LoadingState {
    isLoading: boolean;
    loadingMessage?: string;
    loadingKeys: string[];
}

const initialState: LoadingState = {
    isLoading: false,
    loadingMessage: undefined,
    loadingKeys: [],
};

const loadingSlice = createSlice({
    name: 'loading',
    initialState,
    reducers: {
        startLoading: (
            state,
            action: PayloadAction<{ key?: string; message?: string }>
        ) => {
            const { key, message } = action.payload;
            if (key && !state.loadingKeys.includes(key)) {
                state.loadingKeys.push(key);
            }
            state.isLoading = true;
            if (message) {
                state.loadingMessage = message;
            }
        },
        stopLoading: (state, action: PayloadAction<string | undefined>) => {
            const key = action.payload;
            if (key) {
                state.loadingKeys = state.loadingKeys.filter((k) => k !== key);
            }
            // Only set isLoading to false if no keys are left
            state.isLoading = state.loadingKeys.length > 0;
            if (!state.isLoading) {
                state.loadingMessage = undefined;
            }
        },
        clearAllLoading: (state) => {
            state.isLoading = false;
            state.loadingMessage = undefined;
            state.loadingKeys = [];
        },
    },
});

export const { startLoading, stopLoading, clearAllLoading } =
    loadingSlice.actions;
export default loadingSlice.reducer;
