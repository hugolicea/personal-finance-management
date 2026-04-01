import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryClient } from '../../lib/queryClient';
import type {
    CategoryDeletionRule,
    CreateReclassificationRulePayload,
    ReclassificationRule,
} from '../../types/cleanAndReclassify';
import apiClient from '../../utils/apiClient';

interface PreviewTransaction {
    id: number;
    date: string;
    amount: string;
    description: string;
    category: number;
    category_name: string;
}

export interface PreviewReclassificationResponse {
    matching_count: number;
    transactions: PreviewTransaction[];
    rule_name: string;
    from_category_name: string;
    to_category_name: string;
}

interface BulkExecuteResponse {
    total_transactions_updated: number;
}

interface ListResponse<T> {
    results?: T[];
}

const RECLASSIFICATION_RULES_QUERY_KEY = ['reclassification-rules'] as const;
const DELETION_RULES_QUERY_KEY = ['deletion-rules'] as const;

async function fetchReclassificationRules(): Promise<ReclassificationRule[]> {
    try {
        const response = await apiClient.get<
            ReclassificationRule[] | ListResponse<ReclassificationRule>
        >('/api/v1/reclassification-rules/');

        if (Array.isArray(response.data)) {
            return response.data;
        }

        return response.data.results ?? [];
    } catch (err: unknown) {
        if (isAxiosError(err)) {
            throw new Error(
                err.response?.data?.detail ??
                    'Failed to fetch reclassification rules'
            );
        }
        throw new Error('Failed to fetch reclassification rules');
    }
}

async function fetchCategoryDeletionRules(): Promise<CategoryDeletionRule[]> {
    try {
        const response = await apiClient.get<
            CategoryDeletionRule[] | ListResponse<CategoryDeletionRule>
        >('/api/v1/category-deletion-rules/');

        if (Array.isArray(response.data)) {
            return response.data;
        }

        return response.data.results ?? [];
    } catch (err: unknown) {
        if (isAxiosError(err)) {
            throw new Error(
                err.response?.data?.detail ?? 'Failed to fetch deletion rules'
            );
        }
        throw new Error('Failed to fetch deletion rules');
    }
}

export function useReclassificationRulesQuery() {
    return useQuery({
        queryKey: RECLASSIFICATION_RULES_QUERY_KEY,
        queryFn: fetchReclassificationRules,
    });
}

export function useCreateReclassificationRule() {
    return useMutation<
        ReclassificationRule,
        Error,
        CreateReclassificationRulePayload
    >({
        mutationFn: async (rule) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/reclassification-rules/',
                    rule
                );
                return response.data as ReclassificationRule;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to create reclassification rule'
                    );
                }
                throw new Error('Failed to create reclassification rule');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: RECLASSIFICATION_RULES_QUERY_KEY,
            });
        },
    });
}

export function useDeleteReclassificationRule() {
    return useMutation<
        void,
        Error,
        number,
        { previous?: ReclassificationRule[] }
    >({
        mutationFn: async (id) => {
            try {
                await apiClient.delete(`/api/v1/reclassification-rules/${id}/`);
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to delete reclassification rule'
                    );
                }
                throw new Error('Failed to delete reclassification rule');
            }
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: RECLASSIFICATION_RULES_QUERY_KEY,
            });

            const previous = queryClient.getQueryData<ReclassificationRule[]>(
                RECLASSIFICATION_RULES_QUERY_KEY
            );

            queryClient.setQueryData<ReclassificationRule[]>(
                RECLASSIFICATION_RULES_QUERY_KEY,
                (old) => (old ?? []).filter((rule) => rule.id !== id)
            );

            return { previous };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(
                RECLASSIFICATION_RULES_QUERY_KEY,
                context?.previous
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: RECLASSIFICATION_RULES_QUERY_KEY,
            });
        },
    });
}

export function usePreviewReclassificationRule() {
    return useMutation<PreviewReclassificationResponse, Error, number>({
        mutationFn: async (ruleId) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/preview-reclassification-rule/',
                    { rule_id: ruleId }
                );
                return response.data as PreviewReclassificationResponse;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ?? 'Failed to preview rule'
                    );
                }
                throw new Error('Failed to preview rule');
            }
        },
    });
}

export function useBulkExecuteReclassificationRules() {
    return useMutation<BulkExecuteResponse, Error, number[]>({
        mutationFn: async (ruleIds) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/bulk-execute-reclassification-rules/',
                    { rule_ids: ruleIds }
                );
                return response.data as BulkExecuteResponse;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ?? 'Failed to execute rules'
                    );
                }
                throw new Error('Failed to execute rules');
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            await queryClient.invalidateQueries({ queryKey: ['categories'] });
            await queryClient.invalidateQueries({
                queryKey: ['spending-summary'],
            });
        },
    });
}

export function useCategoryDeletionRulesQuery() {
    return useQuery({
        queryKey: DELETION_RULES_QUERY_KEY,
        queryFn: fetchCategoryDeletionRules,
    });
}

export function useCreateCategoryDeletionRule() {
    return useMutation<CategoryDeletionRule, Error, { category: number }>({
        mutationFn: async (rule) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/category-deletion-rules/',
                    rule
                );
                return response.data as CategoryDeletionRule;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to create deletion rule'
                    );
                }
                throw new Error('Failed to create deletion rule');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: DELETION_RULES_QUERY_KEY,
            });
        },
    });
}

export function useDeleteCategoryDeletionRule() {
    return useMutation<
        void,
        Error,
        number,
        { previous?: CategoryDeletionRule[] }
    >({
        mutationFn: async (id) => {
            try {
                await apiClient.delete(
                    `/api/v1/category-deletion-rules/${id}/`
                );
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to delete deletion rule'
                    );
                }
                throw new Error('Failed to delete deletion rule');
            }
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: DELETION_RULES_QUERY_KEY,
            });

            const previous = queryClient.getQueryData<CategoryDeletionRule[]>(
                DELETION_RULES_QUERY_KEY
            );

            queryClient.setQueryData<CategoryDeletionRule[]>(
                DELETION_RULES_QUERY_KEY,
                (old) => (old ?? []).filter((rule) => rule.id !== id)
            );

            return { previous };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(
                DELETION_RULES_QUERY_KEY,
                context?.previous
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: DELETION_RULES_QUERY_KEY,
            });
        },
    });
}
