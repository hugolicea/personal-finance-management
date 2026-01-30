import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import { Heritage } from '../../types/heritage';

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
        // Transform string fields to numbers with error handling
        return response.data.map((heritage: HeritageApiResponse) => ({
            ...heritage,
            area: heritage.area
                ? isNaN(parseFloat(heritage.area))
                    ? null
                    : parseFloat(heritage.area)
                : null,
            purchase_price: isNaN(parseFloat(heritage.purchase_price))
                ? 0
                : parseFloat(heritage.purchase_price),
            current_value:
                heritage.current_value &&
                !isNaN(parseFloat(heritage.current_value))
                    ? parseFloat(heritage.current_value)
                    : null,
            monthly_rental_income: isNaN(
                parseFloat(heritage.monthly_rental_income)
            )
                ? 0
                : parseFloat(heritage.monthly_rental_income),
            gain_loss: isNaN(parseFloat(heritage.gain_loss))
                ? 0
                : parseFloat(heritage.gain_loss),
            gain_loss_percentage: isNaN(
                parseFloat(heritage.gain_loss_percentage)
            )
                ? 0
                : parseFloat(heritage.gain_loss_percentage),
            annual_rental_income: isNaN(
                parseFloat(heritage.annual_rental_income)
            )
                ? 0
                : parseFloat(heritage.annual_rental_income),
            rental_yield_percentage: isNaN(
                parseFloat(heritage.rental_yield_percentage)
            )
                ? 0
                : parseFloat(heritage.rental_yield_percentage),
        }));
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
