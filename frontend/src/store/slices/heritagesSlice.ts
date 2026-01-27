import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface Heritage {
    id: number;
    name: string;
    heritage_type: string;
    address: string;
    area: number | null;
    area_unit: string;
    purchase_price: number;
    current_value: number | null;
    purchase_date: string;
    monthly_rental_income: number;
    notes: string | null;
    gain_loss: number;
    gain_loss_percentage: number;
    annual_rental_income: number;
    rental_yield_percentage: number;
}

interface HeritagesState {
    heritages: Heritage[];
    loading: boolean;
    deleting: boolean;
    error: string | null;
}

const initialState: HeritagesState = {
    heritages: [],
    loading: false,
    deleting: false,
    error: null,
};

export const fetchHeritages = createAsyncThunk(
    'heritages/fetchHeritages',
    async () => {
        const response = await axios.get('/api/heritages/');
        return response.data;
    }
);

export const createHeritage = createAsyncThunk(
    'heritages/createHeritage',
    async (data: {
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
    }) => {
        const response = await axios.post('/api/heritages/', data);
        return response.data;
    }
);

export const updateHeritage = createAsyncThunk(
    'heritages/updateHeritage',
    async ({ id, data }: { id: number; data: Partial<Heritage> }) => {
        const response = await axios.patch(`/api/heritages/${id}/`, data);
        return response.data;
    }
);

export const deleteHeritage = createAsyncThunk(
    'heritages/deleteHeritage',
    async (id: number) => {
        await axios.delete(`/api/heritages/${id}/`);
        return id;
    }
);

const heritagesSlice = createSlice({
    name: 'heritages',
    initialState,
    reducers: {},
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
                    action.error.message || 'Failed to fetch heritages';
            })
            .addCase(createHeritage.fulfilled, (state, action) => {
                state.heritages.push(action.payload);
            })
            .addCase(updateHeritage.fulfilled, (state, action) => {
                const index = state.heritages.findIndex(
                    (heritage) => heritage.id === action.payload.id
                );
                if (index !== -1) {
                    state.heritages[index] = action.payload;
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
            })
            .addCase(deleteHeritage.rejected, (state, action) => {
                state.deleting = false;
                state.error =
                    action.error.message || 'Failed to delete heritage';
            });
    },
});

export default heritagesSlice.reducer;
