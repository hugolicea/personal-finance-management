import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '../../lib/queryClient';
import type { BankAccount } from '../../types/accounts';
import apiClient from '../../utils/apiClient';
import { getCurrentMonthStr } from '../../utils/dateHelpers';

export interface AccountPayload {
    name: string;
    account_type: string;
    institution?: string;
    account_number?: string;
    currency?: string;
    notes?: string;
    is_active?: boolean;
}

export function useAccountsQuery(month?: string) {
    const resolvedMonth = month ?? getCurrentMonthStr();

    return useQuery({
        queryKey: ['accounts', resolvedMonth],
        queryFn: async () => {
            const response = await apiClient.get('/api/v1/bank-accounts/', {
                params: { page_size: 10000, month: resolvedMonth },
            });

            return (response.data.results || response.data) as BankAccount[];
        },
    });
}

export function useCreateAccount() {
    return useMutation({
        mutationFn: async (data: AccountPayload) => {
            const response = await apiClient.post(
                '/api/v1/bank-accounts/',
                data
            );
            return response.data as BankAccount;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useUpdateAccount() {
    return useMutation({
        mutationFn: async ({
            id,
            ...data
        }: Partial<BankAccount> & { id: number }) => {
            const response = await apiClient.put(
                `/api/v1/bank-accounts/${id}/`,
                data
            );
            return response.data as BankAccount;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useDeleteAccount() {
    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/api/v1/bank-accounts/${id}/`);
        },
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: ['accounts'] });
            const allAccountCaches = queryClient.getQueriesData<BankAccount[]>({
                queryKey: ['accounts'],
            });

            queryClient.setQueriesData<BankAccount[]>(
                { queryKey: ['accounts'] },
                (old) => (old ?? []).filter((a) => a.id !== id)
            );

            return { allAccountCaches };
        },
        onError: (_err, _id, context) => {
            context?.allAccountCaches.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}
