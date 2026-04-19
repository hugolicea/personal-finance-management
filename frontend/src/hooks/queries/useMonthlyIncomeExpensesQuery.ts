import { useQuery } from '@tanstack/react-query';

import type { MonthlyIncomeExpense } from '../../types/index';
import apiClient from '../../utils/apiClient';

async function fetchMonthlyIncomeExpenses(
    year: number
): Promise<MonthlyIncomeExpense[]> {
    const response = await apiClient.get('/api/v1/monthly-income-expenses/', {
        params: { year },
    });
    return response.data;
}

export function useMonthlyIncomeExpensesQuery(year: number) {
    return useQuery({
        queryKey: ['monthly-income-expenses', year],
        queryFn: () => fetchMonthlyIncomeExpenses(year),
        enabled: Number.isFinite(year) && year > 0,
        staleTime: 5 * 60 * 1000,
    });
}
