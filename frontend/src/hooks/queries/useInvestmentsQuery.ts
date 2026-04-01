import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryClient } from '../../lib/queryClient';
import { Investment } from '../../types/investments';
import apiClient from '../../utils/apiClient';

interface InvestmentApiResponse {
    id: number;
    symbol: string;
    name: string;
    investment_type: string;
    quantity: string;
    purchase_price: string;
    current_price: string | null;
    purchase_date: string;
    notes: string | null;
    total_invested: string;
    current_value: string;
    gain_loss: string;
    gain_loss_percentage: string;
    due_date: string | null;
    principal_amount?: string | null;
    interest_rate?: string | null;
    term_years?: string | null;
    compounding_frequency?: string | null;
}

export interface InvestmentPayload {
    symbol: string;
    name: string;
    investment_type: string;
    quantity: number;
    purchase_price: number;
    current_price?: number;
    purchase_date: string;
    notes?: string;
    principal_amount?: number;
    interest_rate?: number;
    compounding_frequency?: string;
    term_years?: number;
}

interface InvestmentsResponse {
    results?: InvestmentApiResponse[];
}

const INVESTMENTS_QUERY_KEY = ['investments'] as const;

function parseInvestment(raw: InvestmentApiResponse): Investment {
    return {
        ...raw,
        quantity: parseFloat(raw.quantity) || 0,
        purchase_price: parseFloat(raw.purchase_price) || 0,
        current_price:
            raw.current_price && !isNaN(parseFloat(raw.current_price))
                ? parseFloat(raw.current_price)
                : null,
        total_invested: parseFloat(raw.total_invested) || 0,
        current_value: parseFloat(raw.current_value) || 0,
        gain_loss: parseFloat(raw.gain_loss) || 0,
        gain_loss_percentage: parseFloat(raw.gain_loss_percentage) || 0,
        principal_amount:
            raw.principal_amount && !isNaN(parseFloat(raw.principal_amount))
                ? parseFloat(raw.principal_amount)
                : null,
        interest_rate:
            raw.interest_rate && !isNaN(parseFloat(raw.interest_rate))
                ? parseFloat(raw.interest_rate)
                : null,
        term_years:
            raw.term_years && !isNaN(parseFloat(raw.term_years))
                ? parseFloat(raw.term_years)
                : null,
    } as Investment;
}

async function fetchInvestments(): Promise<InvestmentApiResponse[]> {
    try {
        const response = await apiClient.get<
            InvestmentApiResponse[] | InvestmentsResponse
        >('/api/v1/investments/?page_size=10000');

        if (Array.isArray(response.data)) {
            return response.data;
        }

        return response.data.results ?? [];
    } catch (err: unknown) {
        if (isAxiosError(err)) {
            throw new Error(
                err.response?.data?.detail ?? 'Failed to fetch investments'
            );
        }
        throw new Error('Failed to fetch investments');
    }
}

export function useInvestmentsQuery() {
    return useQuery({
        queryKey: INVESTMENTS_QUERY_KEY,
        queryFn: fetchInvestments,
        select: (rawList: InvestmentApiResponse[]) =>
            rawList.map(parseInvestment),
    });
}

export function useCreateInvestment() {
    return useMutation<InvestmentApiResponse, Error, InvestmentPayload>({
        mutationFn: async (data) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/investments/',
                    data
                );
                return response.data as InvestmentApiResponse;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to create investment'
                    );
                }
                throw new Error('Failed to create investment');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVESTMENTS_QUERY_KEY });
        },
    });
}

export function useUpdateInvestment() {
    return useMutation<
        InvestmentApiResponse,
        Error,
        { id: number; data: Partial<InvestmentPayload> }
    >({
        mutationFn: async ({ id, data }) => {
            try {
                const response = await apiClient.patch(
                    `/api/v1/investments/${id}/`,
                    data
                );
                return response.data as InvestmentApiResponse;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to update investment'
                    );
                }
                throw new Error('Failed to update investment');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVESTMENTS_QUERY_KEY });
        },
    });
}

export function useDeleteInvestment() {
    return useMutation<void, Error, number, { previous?: Investment[] }>({
        mutationFn: async (id) => {
            try {
                await apiClient.delete(`/api/v1/investments/${id}/`);
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to delete investment'
                    );
                }
                throw new Error('Failed to delete investment');
            }
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: INVESTMENTS_QUERY_KEY,
            });
            const previous = queryClient.getQueryData<Investment[]>(
                INVESTMENTS_QUERY_KEY
            );

            queryClient.setQueryData<Investment[]>(
                INVESTMENTS_QUERY_KEY,
                (old) => (old ?? []).filter((inv) => inv.id !== id)
            );

            return { previous };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(INVESTMENTS_QUERY_KEY, context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: INVESTMENTS_QUERY_KEY });
        },
    });
}
