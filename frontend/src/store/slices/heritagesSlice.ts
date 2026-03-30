import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import { Heritage } from '../../types/heritage';
import apiClient from '../../utils/apiClient';
import type { RootState } from '../index';

interface HeritageApiResponse {
    id: number;
    name: string;
    heritage_type: string;
    address: string;
    area: string | null;
    area_unit: string;
    purchase_price: string;
    current_value: string | null;
    purchase_date: string;
    monthly_rental_income: string;
    notes: string | null;
    gain_loss: string;
    gain_loss_percentage: string;
    annual_rental_income: string;
    rental_yield_percentage: string;
}

interface HeritagesState {
    heritages: Heritage[];
    _deletedCache: Heritage[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: HeritagesState = {
    heritages: [],
    _deletedCache: [],
    loading: false,
    deleting: false,
    error: null,
};

function parseHeritage(raw: HeritageApiResponse): Heritage {
    return {
        ...raw,
        area:
            raw.area && !isNaN(parseFloat(raw.area))
                ? parseFloat(raw.area)
                : null,
        purchase_price: parseFloat(raw.purchase_price) || 0,
        current_value:
            raw.current_value && !isNaN(parseFloat(raw.current_value))
                ? parseFloat(raw.current_value)
                : null,
        monthly_rental_income: parseFloat(raw.monthly_rental_income) || 0,
        gain_loss: parseFloat(raw.gain_loss) || 0,
        gain_loss_percentage: parseFloat(raw.gain_loss_percentage) || 0,
        annual_rental_income: parseFloat(raw.annual_rental_income) || 0,
        rental_yield_percentage: parseFloat(raw.rental_yield_percentage) || 0,
    } as Heritage;
}

export const fetchHeritages = createAsyncThunk(
    'heritages/fetchHeritages',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(
                '/api/v1/heritages/?page_size=10000'
            );
            const data = response.data.results || response.data;
            return (data as HeritageApiResponse[]).map(parseHeritage);
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to fetch heritages'
                );
            }
            return rejectWithValue('Failed to fetch heritages');
        }
    }
);

export const createHeritage = createAsyncThunk(
    'heritages/createHeritage',
    async (
        data: {
            name: string;
            heritage_type: string;
            address: string;
            area?: number;
            area_unit?: string;
            purchase_price: number;
            current_value?: number;
            purchase_date: string;
            monthly_rental_income?: number;
            notes?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.post('/api/v1/heritages/', data);
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to create heritage'
                );
            }
            return rejectWithValue('Failed to create heritage');
        }
    }
);

export const updateHeritage = createAsyncThunk(
    'heritages/updateHeritage',
    async (
        { id, data }: { id: number; data: Partial<Heritage> },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.patch(
                `/api/v1/heritages/${id}/`,
                data
            );
            return response.data;
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to update heritage'
                );
            }
            return rejectWithValue('Failed to update heritage');
        }
    }
);

export const deleteHeritage = createAsyncThunk(
    'heritages/deleteHeritage',
    async (id: number, { dispatch, rejectWithValue }) => {
        dispatch(optimisticDelete(id));
        try {
            await apiClient.delete(`/api/v1/heritages/${id}/`);
            return id;
        } catch (err: unknown) {
            dispatch(rollbackDelete(id));
            if (isAxiosError(err)) {
                return rejectWithValue(
                    err.response?.data?.detail ?? 'Failed to delete heritage'
                );
            }
            return rejectWithValue('Failed to delete heritage');
        }
    }
);

const heritagesSlice = createSlice({
    name: 'heritages',
    initialState,
    reducers: {
        optimisticDelete(state, action: PayloadAction<number>) {
            const index = state.heritages.findIndex(
                (heritage) => heritage.id === action.payload
            );
            if (index === -1) {
                return;
            }

            const [deletedHeritage] = state.heritages.splice(index, 1);
            state._deletedCache.push(deletedHeritage!);
        },
        rollbackDelete(state, action: PayloadAction<number>) {
            const cachedIndex = state._deletedCache.findIndex(
                (heritage) => heritage.id === action.payload
            );
            if (cachedIndex === -1) {
                return;
            }

            const [restoredHeritage] = state._deletedCache.splice(
                cachedIndex,
                1
            );
            state.heritages.push(restoredHeritage!);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHeritages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHeritages.fulfilled, (state, action) => {
                state.loading = false;
                state.heritages = action.payload;
            })
            .addCase(fetchHeritages.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    (action.payload as string) || 'Failed to fetch heritages';
            })
            .addCase(createHeritage.fulfilled, (state, action) => {
                state.heritages.push(
                    parseHeritage(action.payload as HeritageApiResponse)
                );
            })
            .addCase(updateHeritage.fulfilled, (state, action) => {
                const index = state.heritages.findIndex(
                    (heritage) => heritage.id === action.payload.id
                );
                if (index !== -1) {
                    state.heritages[index] = parseHeritage(
                        action.payload as HeritageApiResponse
                    );
                }
            })
            .addCase(deleteHeritage.pending, (state) => {
                state.deleting = true;
            })
            .addCase(deleteHeritage.fulfilled, (state, action) => {
                state.deleting = false;
                state.heritages = state.heritages.filter(
                    (heritage) => heritage.id !== action.payload
                );
                state._deletedCache = state._deletedCache.filter(
                    (heritage) => heritage.id !== action.payload
                );
            })
            .addCase(deleteHeritage.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    (action.payload as string) || 'Failed to delete heritage';
            });
    },
});

export const { optimisticDelete, rollbackDelete } = heritagesSlice.actions;

export const selectPropertyValue = (state: RootState): number =>
    state.heritages.heritages.reduce(
        (sum, h) => sum + (h.current_value || h.purchase_price || 0),
        0
    );

export default heritagesSlice.reducer;
