import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import apiClient from '../../utils/apiClient';

export interface RestoreResult {
    message: string;
    summary: {
        categories: number;
        bank_accounts: number;
        transactions: number;
        investments: number;
        heritages: number;
        retirement_accounts: number;
        reclassification_rules: number;
        category_deletion_rules: number;
        users?: number;
    };
}

export function useDownloadBackup() {
    return useMutation<void, Error, string[]>({
        mutationFn: async (models: string[]) => {
            try {
                const response = await apiClient.get('/api/v1/backup/', {
                    responseType: 'blob',
                    params:
                        models.length > 0
                            ? { models: models.join(',') }
                            : undefined,
                });

                const contentDisposition =
                    response.headers['content-disposition'] ?? '';
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                const filename = match ? match[1] : 'backup.json';
                const url = window.URL.createObjectURL(
                    new Blob([response.data])
                );
                const link = document.createElement('a');

                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.error ?? 'Failed to download backup'
                    );
                }
                throw new Error('Failed to download backup');
            }
        },
    });
}

export function useRestoreBackup() {
    return useMutation<
        RestoreResult,
        Error,
        { file: File; replaceExisting: boolean }
    >({
        mutationFn: async ({ file, replaceExisting }) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append(
                    'replace_existing',
                    replaceExisting ? 'true' : 'false'
                );

                const response = await apiClient.post(
                    '/api/v1/restore/',
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }
                );

                return response.data as RestoreResult;
            } catch (err: unknown) {
                if (isAxiosError(err)) {
                    throw new Error(
                        err.response?.data?.error ?? 'Failed to restore backup'
                    );
                }
                throw new Error('Failed to restore backup');
            }
        },
    });
}
