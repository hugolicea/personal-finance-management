import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryClient } from '../../lib/queryClient';
import apiClient from '../../utils/apiClient';

export interface RetirementAccountApiResponse {
    id: number;
    name: string;
    account_type: string;
    provider: string;
    account_number: string | null;
    current_balance: string;
    monthly_contribution: string;
    employer_match_percentage: string;
    employer_match_limit: string;
    risk_level: string;
    target_retirement_age: string;
    notes: string | null;
    annual_contribution: string;
    employer_match_amount: string;
    total_annual_contribution: string;
    created_at?: string | null;
}

export interface RetirementAccount {
    id: number;
    name: string;
    account_type: string;
    provider: string;
    account_number: string | null;
    current_balance: number;
    monthly_contribution: number;
    employer_match_percentage: number;
    employer_match_limit: number;
    risk_level: string;
    target_retirement_age: number;
    notes: string | null;
    annual_contribution: number;
    employer_match_amount: number;
    total_annual_contribution: number;
    created_at?: string | null;
}

export interface RetirementAccountPayload {
    name: string;
    account_type: string;
    provider: string;
    account_number?: string;
    current_balance?: number;
    monthly_contribution?: number;
    employer_match_percentage?: number;
    employer_match_limit?: number;
    risk_level?: string;
    target_retirement_age?: number;
    notes?: string;
}

interface RetirementAccountsResponse {
    results?: RetirementAccountApiResponse[];
}

const RETIREMENT_ACCOUNTS_QUERY_KEY = ['retirement-accounts'] as const;

export function parseRetirementAccount(
    raw: RetirementAccountApiResponse
): RetirementAccount {
    return {
        ...raw,
        current_balance: parseFloat(raw.current_balance) || 0,
        monthly_contribution: parseFloat(raw.monthly_contribution) || 0,
        employer_match_percentage:
            parseFloat(raw.employer_match_percentage) || 0,
        employer_match_limit: parseFloat(raw.employer_match_limit) || 0,
        target_retirement_age: parseInt(raw.target_retirement_age, 10) || 65,
        annual_contribution: parseFloat(raw.annual_contribution) || 0,
        employer_match_amount: parseFloat(raw.employer_match_amount) || 0,
        total_annual_contribution:
            parseFloat(raw.total_annual_contribution) || 0,
    };
}

async function fetchRetirementAccounts(): Promise<
    RetirementAccountApiResponse[]
> {
    try {
        const response = await apiClient.get<
            RetirementAccountApiResponse[] | RetirementAccountsResponse
        >('/api/v1/retirement-accounts/?page_size=10000');

        if (Array.isArray(response.data)) {
            return response.data;
        }

        return response.data.results ?? [];
    } catch (err: unknown) {
        if (isAxiosError<{ detail?: string }>(err)) {
            throw new Error(
                err.response?.data?.detail ??
                    'Failed to fetch retirement accounts'
            );
        }
        throw new Error('Failed to fetch retirement accounts');
    }
}

export function useRetirementAccountsQuery() {
    return useQuery({
        queryKey: RETIREMENT_ACCOUNTS_QUERY_KEY,
        queryFn: fetchRetirementAccounts,
        select: (rawList: RetirementAccountApiResponse[]) =>
            rawList.map(parseRetirementAccount),
    });
}

export function useCreateRetirementAccount() {
    return useMutation<RetirementAccount, Error, RetirementAccountPayload>({
        mutationFn: async (data) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/retirement-accounts/',
                    data
                );
                return parseRetirementAccount(
                    response.data as RetirementAccountApiResponse
                );
            } catch (err: unknown) {
                if (isAxiosError<{ detail?: string }>(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to create retirement account'
                    );
                }
                throw new Error('Failed to create retirement account');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: RETIREMENT_ACCOUNTS_QUERY_KEY,
            });
        },
    });
}

export function useUpdateRetirementAccount() {
    return useMutation<
        RetirementAccount,
        Error,
        { id: number; data: Partial<RetirementAccountPayload> }
    >({
        mutationFn: async ({ id, data }) => {
            try {
                const response = await apiClient.patch(
                    `/api/v1/retirement-accounts/${id}/`,
                    data
                );
                return parseRetirementAccount(
                    response.data as RetirementAccountApiResponse
                );
            } catch (err: unknown) {
                if (isAxiosError<{ detail?: string }>(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to update retirement account'
                    );
                }
                throw new Error('Failed to update retirement account');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: RETIREMENT_ACCOUNTS_QUERY_KEY,
            });
        },
    });
}

export function useDeleteRetirementAccount() {
    return useMutation<void, Error, number, { previous?: RetirementAccount[] }>(
        {
            mutationFn: async (id) => {
                try {
                    await apiClient.delete(
                        `/api/v1/retirement-accounts/${id}/`
                    );
                } catch (err: unknown) {
                    if (isAxiosError<{ detail?: string }>(err)) {
                        throw new Error(
                            err.response?.data?.detail ??
                                'Failed to delete retirement account'
                        );
                    }
                    throw new Error('Failed to delete retirement account');
                }
            },
            onMutate: async (id) => {
                await queryClient.cancelQueries({
                    queryKey: RETIREMENT_ACCOUNTS_QUERY_KEY,
                });
                const previous = queryClient.getQueryData<RetirementAccount[]>(
                    RETIREMENT_ACCOUNTS_QUERY_KEY
                );

                queryClient.setQueryData<RetirementAccount[]>(
                    RETIREMENT_ACCOUNTS_QUERY_KEY,
                    (old) => (old ?? []).filter((account) => account.id !== id)
                );

                return { previous };
            },
            onError: (_err, _id, context) => {
                queryClient.setQueryData(
                    RETIREMENT_ACCOUNTS_QUERY_KEY,
                    context?.previous
                );
            },
            onSettled: () => {
                queryClient.invalidateQueries({
                    queryKey: RETIREMENT_ACCOUNTS_QUERY_KEY,
                });
            },
        }
    );
}
