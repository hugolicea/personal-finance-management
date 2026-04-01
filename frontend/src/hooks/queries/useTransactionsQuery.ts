import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryClient } from '../../lib/queryClient';
import type {
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkReclassifyResponse,
    Transaction,
} from '../../types/transactions';
import apiClient from '../../utils/apiClient';

export interface TransactionQueryParams {
    account?: number;
    category?: string;
    search?: string;
    date_after?: string;
    date_before?: string;
    ordering?: string;
    page?: number;
}

interface TransactionListResponse {
    results: Transaction[];
    count: number;
    next: string | null;
    previous: string | null;
}

interface CreateTransactionPayload {
    amount: number;
    description: string;
    date: string;
    category: number;
    account: number;
}

interface UpdateTransactionPayload {
    id: number;
    amount?: number;
    description?: string;
    date?: string;
    category?: number;
    account?: number;
}

interface UploadBankStatementPayload {
    file: File;
    accountId?: number;
}

interface BulkReclassifyPayload {
    from_category_id: number;
    to_category_id: number;
}

interface UploadedTransactionRecord {
    id?: number;
    row?: number;
    date: string;
    description: string;
    amount: number;
    category?: string;
    reason?: string;
}

interface UploadBankStatementResult {
    message: string;
    transactions_created: UploadedTransactionRecord[];
    transactions_skipped: UploadedTransactionRecord[];
    errors: string[];
    summary: {
        created: number;
        skipped: number;
        errors: number;
    };
}

function normalizeTransaction(transaction: Transaction): Transaction {
    return {
        ...transaction,
        amount:
            typeof transaction.amount === 'string'
                ? parseFloat(transaction.amount)
                : transaction.amount,
        category:
            typeof transaction.category === 'string'
                ? parseInt(transaction.category, 10)
                : transaction.category,
    };
}

function normalizeError(error: unknown, fallback: string): never {
    if (isAxiosError(error)) {
        throw new Error(
            error.response?.data?.detail ??
                error.response?.data?.error ??
                fallback
        );
    }

    throw new Error(fallback);
}

function invalidateTransactionQueries() {
    queryClient.invalidateQueries({ queryKey: ['transactions'], exact: false });
}

export function useTransactionsQuery(params: TransactionQueryParams = {}) {
    return useQuery({
        queryKey: ['transactions', params],
        queryFn: async () => {
            const queryParams: Record<string, string | number> = {
                page_size: 1000,
            };

            if (params.account !== undefined)
                queryParams['account'] = params.account;
            if (params.category) queryParams['category'] = params.category;
            if (params.search) queryParams['search'] = params.search;
            if (params.ordering) queryParams['ordering'] = params.ordering;
            if (params.page !== undefined) queryParams['page'] = params.page;
            if (params.date_after) queryParams['date__gte'] = params.date_after;
            if (params.date_before)
                queryParams['date__lte'] = params.date_before;

            const response = await apiClient.get('/api/v1/transactions/', {
                params: queryParams,
            });

            const data = response.data;
            if (Array.isArray(data)) {
                const normalized = data.map((transaction) =>
                    normalizeTransaction(transaction as Transaction)
                );
                return {
                    results: normalized,
                    count: normalized.length,
                    next: null,
                    previous: null,
                } satisfies TransactionListResponse;
            }

            const normalizedResults = (data.results ?? []).map(
                (transaction: Transaction) => normalizeTransaction(transaction)
            );

            return {
                ...data,
                results: normalizedResults,
            } as TransactionListResponse;
        },
    });
}

export function useCreateTransaction() {
    return useMutation<Transaction, Error, CreateTransactionPayload>({
        mutationFn: async (data) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/transactions/',
                    data
                );
                return normalizeTransaction(response.data as Transaction);
            } catch (error: unknown) {
                return normalizeError(error, 'Failed to create transaction');
            }
        },
        onSuccess: () => {
            invalidateTransactionQueries();
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useUpdateTransaction() {
    return useMutation<Transaction, Error, UpdateTransactionPayload>({
        mutationFn: async ({ id, ...data }) => {
            try {
                const response = await apiClient.put(
                    `/api/v1/transactions/${id}/`,
                    data
                );
                return normalizeTransaction(response.data as Transaction);
            } catch (error: unknown) {
                return normalizeError(error, 'Failed to update transaction');
            }
        },
        onSuccess: () => {
            invalidateTransactionQueries();
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useDeleteTransaction() {
    return useMutation<number, Error, number>({
        mutationFn: async (id) => {
            try {
                await apiClient.delete(`/api/v1/transactions/${id}/`);
                return id;
            } catch (error: unknown) {
                return normalizeError(error, 'Failed to delete transaction');
            }
        },
        onSettled: () => {
            invalidateTransactionQueries();
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useUploadBankStatement() {
    return useMutation<
        UploadBankStatementResult,
        Error,
        UploadBankStatementPayload
    >({
        mutationFn: async ({ file, accountId }) => {
            const formData = new FormData();
            formData.append('file', file);
            if (accountId !== undefined) {
                formData.append('account_id', String(accountId));
            }

            try {
                const response = await apiClient.post(
                    '/api/v1/upload-bank-statement/',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                return response.data as UploadBankStatementResult;
            } catch (error: unknown) {
                return normalizeError(error, 'Failed to upload bank statement');
            }
        },
        onSuccess: () => {
            invalidateTransactionQueries();
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useBulkReclassifyTransactions() {
    return useMutation<BulkReclassifyResponse, Error, BulkReclassifyPayload>({
        mutationFn: async (data) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/bulk-reclassify-transactions/',
                    data
                );
                return response.data as BulkReclassifyResponse;
            } catch (error: unknown) {
                return normalizeError(
                    error,
                    'Failed to reclassify transactions'
                );
            }
        },
        onSuccess: () => {
            invalidateTransactionQueries();
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['category-spending'] });
        },
    });
}

export function useBulkDeleteTransactions() {
    return useMutation<BulkDeleteResponse, Error, BulkDeleteRequest>({
        mutationFn: async (data) => {
            try {
                const response = await apiClient.post(
                    '/api/v1/bulk-delete-transactions/',
                    data
                );
                return response.data as BulkDeleteResponse;
            } catch (error: unknown) {
                return normalizeError(error, 'Failed to delete transactions');
            }
        },
        onSuccess: () => {
            invalidateTransactionQueries();
            queryClient.invalidateQueries({ queryKey: ['spending-summary'] });
        },
    });
}
