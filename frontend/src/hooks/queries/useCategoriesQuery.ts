import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryClient } from '../../lib/queryClient';
import type { Category, CategorySpending } from '../../types/categories';
import apiClient from '../../utils/apiClient';

interface CategoryPayload {
    name: string;
    classification: string;
    monthly_budget: number;
}

interface UpdateCategoryPayload extends CategoryPayload {
    id: number;
}

export function useCategoriesQuery() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await apiClient.get(
                '/api/v1/categories/?page_size=10000'
            );
            return (response.data.results || response.data) as Category[];
        },
    });
}

export function useCategorySpendingQuery(period: string) {
    // period = 'YYYY-MM' format, endpoint is /api/v1/category-spending/{period}/
    return useQuery({
        queryKey: ['category-spending', period],
        queryFn: async () => {
            const response = await apiClient.get(
                `/api/v1/category-spending/${period}/`
            );
            return response.data as CategorySpending[];
        },
        enabled: Boolean(period),
    });
}

export function useCreateCategory() {
    return useMutation<Category, Error, CategoryPayload>({
        mutationFn: async (data) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/categories/',
                    data
                );
                return response.data as Category;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to create category'
                    );
                }
                throw new Error('Failed to create category');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
        },
    });
}

export function useUpdateCategory() {
    return useMutation<Category, Error, UpdateCategoryPayload>({
        mutationFn: async ({ id, name, classification, monthly_budget }) => {
            try {
                const response = await apiClient.put(
                    `/api/v1/categories/${id}/`,
                    {
                        name,
                        classification,
                        monthly_budget,
                    }
                );
                return response.data as Category;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to update category'
                    );
                }
                throw new Error('Failed to update category');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
        },
    });
}

export function useDeleteCategory() {
    return useMutation<number, Error, number, { previous?: Category[] }>({
        mutationFn: async (id) => {
            try {
                await apiClient.delete(`/api/v1/categories/${id}/`);
                return id;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.detail ??
                            'Failed to delete category'
                    );
                }
                throw new Error('Failed to delete category');
            }
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['categories'] });
            const previous = queryClient.getQueryData<Category[]>([
                'categories',
            ]);
            queryClient.setQueryData<Category[]>(['categories'], (old) =>
                (old ?? []).filter((c) => c.id !== id)
            );
            return { previous };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(['categories'], context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
            queryClient.invalidateQueries({ queryKey: ['category-spending'] });
        },
    });
}
