import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

import type { RestoreResult } from '../hooks/queries/useBackupMutations';
import {
    useDownloadBackup,
    useRestoreBackup,
} from '../hooks/queries/useBackupMutations';
import { useAppSelector } from '../hooks/redux';

// Hoisted to module level � never recreated on render (rendering-hoist-jsx)
// Regular models: governed by the "All" toggle, available to every user.
const REGULAR_MODEL_KEYS = [
    'categories',
    'bank_accounts',
    'transactions',
    'investments',
    'heritages',
    'retirement_accounts',
    'reclassification_rules',
    'category_deletion_rules',
] as const;

// Staff-only models: opt-in only, never included by the "All" toggle.
const STAFF_MODEL_KEYS = ['users'] as const;

const ALL_MODEL_KEYS = [...REGULAR_MODEL_KEYS, ...STAFF_MODEL_KEYS] as const;

type BackupModel = (typeof ALL_MODEL_KEYS)[number];

const MODEL_LABELS: Record<BackupModel, string> = {
    users: 'Users',
    categories: 'Categories',
    bank_accounts: 'Bank Accounts',
    transactions: 'Transactions',
    investments: 'Investments',
    heritages: 'Heritage / Property',
    retirement_accounts: 'Retirement Accounts',
    reclassification_rules: 'Reclassification Rules',
    category_deletion_rules: 'Category Deletion Rules',
};

function DatabaseBackup() {
    const downloadMutation = useDownloadBackup();
    const restoreMutation = useRestoreBackup();
    const restoreResult: RestoreResult | null = restoreMutation.data ?? null;
    const error =
        downloadMutation.error?.message ??
        restoreMutation.error?.message ??
        null;
    const isStaff = useAppSelector(
        (state) => state.auth.user?.is_staff ?? false
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [confirmReplace, setConfirmReplace] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    // Lazy init � Set is non-primitive (rerender-lazy-state-init)
    // Staff-only models ('users') are excluded from the default selection.
    const [selectedModels, setSelectedModels] = useState<Set<BackupModel>>(
        () => new Set(REGULAR_MODEL_KEYS)
    );
    // ref for the "All" checkbox indeterminate state (cannot be set via React prop)
    const allCheckboxRef = useRef<HTMLInputElement>(null);

    const allRegularSelected = REGULAR_MODEL_KEYS.every((k) =>
        selectedModels.has(k)
    );
    const someRegularSelected =
        REGULAR_MODEL_KEYS.some((k) => selectedModels.has(k)) &&
        !allRegularSelected;

    // Drive the indeterminate attribute imperatively whenever selection changes
    useEffect(() => {
        if (allCheckboxRef.current) {
            allCheckboxRef.current.indeterminate = someRegularSelected;
        }
    }, [someRegularSelected]);

    const handleToggleAll = useCallback(() => {
        // Only toggles regular (non-staff) models � never auto-selects 'users'.
        setSelectedModels((prev) => {
            const next = new Set(prev);
            if (allRegularSelected) {
                REGULAR_MODEL_KEYS.forEach((k) => next.delete(k));
            } else {
                REGULAR_MODEL_KEYS.forEach((k) => next.add(k));
            }
            return next;
        });
    }, [allRegularSelected]);

    const handleToggleModel = useCallback((model: BackupModel) => {
        setSelectedModels((prev) => {
            const next = new Set(prev);
            if (next.has(model)) {
                next.delete(model);
            } else {
                next.add(model);
            }
            return next;
        });
    }, []);

    const handleDownload = useCallback(() => {
        // Always send explicit list � never rely on backend "all" default
        // which would include users and cause 403 for non-staff.
        downloadMutation.mutate(Array.from(selectedModels));
    }, [downloadMutation, selectedModels]);

    const handleFileSelect = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            setSelectedFile(file);
            restoreMutation.reset();
        },
        [restoreMutation]
    );

    const handleReplaceExistingChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setReplaceExisting(e.target.checked);
            setConfirmReplace(false);
            setConfirmError(null);
        },
        []
    );

    const handleConfirmReplaceChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setConfirmReplace(e.target.checked);
            setConfirmError(null);
        },
        []
    );

    const handleRestore = useCallback(async () => {
        if (!selectedFile) return;
        if (replaceExisting && !confirmReplace) {
            setConfirmError(
                'Check the confirmation checkbox to confirm you want to replace all existing data.'
            );
            return;
        }
        setConfirmError(null);
        try {
            await restoreMutation.mutateAsync({
                file: selectedFile,
                replaceExisting,
            });
            setSelectedFile(null);
            setConfirmReplace(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: unknown) {
            if (err instanceof Error) {
                setConfirmError(err.message);
                return;
            }
            setConfirmError('Failed to restore backup');
        }
    }, [confirmReplace, replaceExisting, restoreMutation, selectedFile]);

    return (
        <div className='max-w-2xl mx-auto space-y-8'>
            <div>
                <h1 className='text-2xl font-bold text-base-content'>
                    Database Backup & Restore
                </h1>
                <p className='mt-1 text-sm opacity-60'>
                    Export your data to a JSON file or restore from a previous
                    backup.
                </p>
            </div>

            {/* Backup section */}
            <div className='card bg-base-100 shadow-sm p-6 space-y-4'>
                <h2 className='text-lg font-medium mb-1'>Export Backup</h2>
                <p className='text-sm text-base-content/60'>
                    Downloads a JSON file containing your selected data. Choose
                    which models to include below.
                </p>

                {/* Model selector */}
                <fieldset>
                    <legend className='text-sm font-medium mb-2'>
                        Include in backup
                    </legend>
                    <div className='rounded-md border border-base-300 divide-y divide-base-200'>
                        {/* "All" master toggle � controls regular models only */}
                        <label className='flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-t-md'>
                            <input
                                ref={allCheckboxRef}
                                type='checkbox'
                                checked={allRegularSelected}
                                onChange={handleToggleAll}
                                className='h-4 w-4 rounded border-base-300 text-indigo-600'
                                aria-label='Select all data types'
                            />
                            <span className='text-sm font-semibold text-base-content'>
                                All
                            </span>
                            <span className='ml-auto text-xs text-base-content/50'>
                                {
                                    REGULAR_MODEL_KEYS.filter((k) =>
                                        selectedModels.has(k)
                                    ).length
                                }{' '}
                                / {REGULAR_MODEL_KEYS.length} selected
                            </span>
                        </label>

                        {/* Regular model checkboxes */}
                        {REGULAR_MODEL_KEYS.map((model) => (
                            <label
                                key={model}
                                className='flex items-center gap-3 px-4 py-2.5 pl-8 cursor-pointer'
                            >
                                <input
                                    type='checkbox'
                                    checked={selectedModels.has(model)}
                                    onChange={() => handleToggleModel(model)}
                                    className='h-4 w-4 rounded border-base-300 text-indigo-600'
                                />
                                <span className='text-sm opacity-70'>
                                    {MODEL_LABELS[model]}
                                </span>
                            </label>
                        ))}

                        {/* Staff-only model checkboxes � only rendered for staff users */}
                        {isStaff &&
                            STAFF_MODEL_KEYS.map((model) => (
                                <label
                                    key={model}
                                    className='flex items-center gap-3 px-4 py-2.5 pl-8 cursor-pointer last:rounded-b-md'
                                >
                                    <input
                                        type='checkbox'
                                        checked={selectedModels.has(model)}
                                        onChange={() =>
                                            handleToggleModel(model)
                                        }
                                        className='h-4 w-4 rounded border-base-300 text-indigo-600'
                                    />
                                    <span className='text-sm opacity-70'>
                                        {MODEL_LABELS[model]}
                                    </span>
                                    <span className='ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700'>
                                        staff only
                                    </span>
                                </label>
                            ))}
                    </div>
                </fieldset>

                <button
                    onClick={handleDownload}
                    disabled={
                        downloadMutation.isPending || selectedModels.size === 0
                    }
                    className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {downloadMutation.isPending ? (
                        <svg
                            aria-hidden='true'
                            className='animate-spin h-4 w-4'
                            viewBox='0 0 24 24'
                            fill='none'
                        >
                            <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                            />
                            <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8v8H4z'
                            />
                        </svg>
                    ) : (
                        <span aria-hidden='true'>💾</span>
                    )}
                    Download Backup
                </button>
                {selectedModels.size === 0 && (
                    <p className='text-xs text-amber-600'>
                        Select at least one data type to export.
                    </p>
                )}
            </div>

            {/* Restore section */}
            <div className='card bg-base-100 shadow-sm p-6 space-y-4'>
                <h2 className='text-lg font-medium'>Restore from Backup</h2>
                <p className='text-sm text-base-content/60'>
                    Upload a <code>.json</code> backup file exported from this
                    application. Duplicate transactions (same reference ID) will
                    be skipped automatically.
                </p>

                <div>
                    <label
                        htmlFor='backup-file'
                        className='block text-sm font-medium mb-1'
                    >
                        Backup file
                    </label>
                    <input
                        id='backup-file'
                        ref={fileInputRef}
                        type='file'
                        accept='.json'
                        onChange={handleFileSelect}
                        className='block table table-zebra w-full text-base-content/60 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                    />
                </div>

                {/* Replace existing toggle */}
                <div className='rounded-md bg-yellow-50 border border-yellow-200 p-4 space-y-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={replaceExisting}
                            onChange={handleReplaceExistingChange}
                            className='h-4 w-4 rounded border-base-300 text-error'
                        />
                        <span className='text-sm font-medium text-yellow-800'>
                            Replace all existing data
                        </span>
                    </label>
                    <p className='text-xs text-yellow-700 pl-6'>
                        When enabled, ALL your current data (transactions,
                        categories, investments, etc.) will be permanently
                        deleted before the backup is imported.
                    </p>
                    {replaceExisting && (
                        <label className='flex items-center gap-2 cursor-pointer pl-6'>
                            <input
                                type='checkbox'
                                checked={confirmReplace}
                                onChange={handleConfirmReplaceChange}
                                className='h-4 w-4 rounded border-red-400 text-error'
                            />
                            <span className='text-xs font-semibold text-red-700'>
                                I understand this will permanently delete my
                                existing data
                            </span>
                        </label>
                    )}
                </div>

                <button
                    onClick={handleRestore}
                    disabled={restoreMutation.isPending || !selectedFile}
                    className='btn btn-primary'
                >
                    {restoreMutation.isPending ? (
                        <svg
                            aria-hidden='true'
                            className='animate-spin h-4 w-4'
                            viewBox='0 0 24 24'
                            fill='none'
                        >
                            <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                            />
                            <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8v8H4z'
                            />
                        </svg>
                    ) : (
                        <span aria-hidden='true'>🔄</span>
                    )}
                    Restore Backup
                </button>
                {confirmError && (
                    <p role='alert' className='text-sm text-error'>
                        {confirmError}
                    </p>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className='rounded-md bg-red-50 border border-red-200 p-4'>
                    <p className='text-sm text-red-700'>
                        <span aria-hidden='true'>? </span>
                        {error}
                    </p>
                </div>
            )}

            {/* Success result */}
            {restoreResult && (
                <div className='rounded-md bg-green-50 border border-green-200 p-4 space-y-3'>
                    <p className='text-sm font-medium text-green-800'>
                        <span aria-hidden='true'>? </span>
                        {restoreResult.message}
                    </p>
                    <table className='min-table table-zebra w-full'>
                        <tbody>
                            {Object.entries(restoreResult.summary).map(
                                ([key, value]) => (
                                    <tr key={key}>
                                        <td className='pr-4 py-0.5 capitalize text-base-content/70'>
                                            {key.replace(/_/g, ' ')}
                                        </td>
                                        <td className='font-semibold text-base-content'>
                                            {value} imported
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default DatabaseBackup;
