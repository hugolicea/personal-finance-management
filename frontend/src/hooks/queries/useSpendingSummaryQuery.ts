import { useQuery } from '@tanstack/react-query';

import type {
    SpendingSummaryItem,
    SpendingSummaryResponse,
} from '../../types/categories';
import apiClient from '../../utils/apiClient';

async function fetchSpendingSummary(
    month: string
): Promise<SpendingSummaryResponse> {
    const response = await apiClient.get('/api/v1/spending-summary/', {
        params: { month },
    });
    return response.data;
}

export function useSpendingSummaryQuery(month: string) {
    return useQuery({
        queryKey: ['spending-summary', month],
        queryFn: () => fetchSpendingSummary(month),
        enabled: Boolean(month),
        select: (
            data: SpendingSummaryResponse
        ): { month: string; categories: SpendingSummaryItem[] } => ({
            month: data.month,
            categories: data.categories,
        }),
    });
}
