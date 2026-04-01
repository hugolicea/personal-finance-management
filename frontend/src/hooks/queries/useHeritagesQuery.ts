import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '../../lib/queryClient';
import type { Heritage } from '../../types/heritage';
import apiClient from '../../utils/apiClient';

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

interface HeritagePayload {
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
}

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

async function fetchHeritages(): Promise<HeritageApiResponse[]> {
    const response = await apiClient.get('/api/v1/heritages/?page_size=10000');
    const data = response.data as
        | HeritageApiResponse[]
        | { results?: HeritageApiResponse[] };

    if (Array.isArray(data)) {
        return data;
    }

    return data.results ?? [];
}

export function useHeritagesQuery() {
    return useQuery({
        queryKey: ['heritages'],
        queryFn: fetchHeritages,
        select: (rawList: HeritageApiResponse[]) => rawList.map(parseHeritage),
    });
}

export function useCreateHeritage() {
    return useMutation({
        mutationFn: async (data: HeritagePayload) => {
            await apiClient.post('/api/v1/heritages/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['heritages'] });
        },
    });
}

export function useUpdateHeritage() {
    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: HeritagePayload;
        }) => {
            await apiClient.patch(`/api/v1/heritages/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['heritages'] });
        },
    });
}

export function useDeleteHeritage() {
    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/api/v1/heritages/${id}/`);
        },
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: ['heritages'] });
            const previous = queryClient.getQueryData<Heritage[]>([
                'heritages',
            ]);

            queryClient.setQueryData<Heritage[]>(['heritages'], (old) =>
                (old ?? []).filter((h) => h.id !== id)
            );

            return { previous };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(['heritages'], context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['heritages'] });
        },
    });
}
