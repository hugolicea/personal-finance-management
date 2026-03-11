import React, { useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    clearRestoreResult,
    downloadBackup,
    restoreBackup,
} from '../store/slices/backupSlice';

const DatabaseBackup: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading, error, restoreResult } = useAppSelector(
        (state) => state.backup
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [confirmReplace, setConfirmReplace] = useState(false);

    const handleDownload = () => {
        dispatch(downloadBackup());
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        dispatch(clearRestoreResult());
    };

    const handleRestore = async () => {
        if (!selectedFile) return;
        if (replaceExisting && !confirmReplace) {
            alert(
                'Check the confirmation checkbox to confirm you want to replace all existing data.'
            );
            return;
        }
        await dispatch(restoreBackup({ file: selectedFile, replaceExisting }));
        setSelectedFile(null);
        setConfirmReplace(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className='max-w-2xl mx-auto space-y-8'>
            <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                    Database Backup & Restore
                </h1>
                <p className='mt-1 text-sm text-gray-500'>
                    Export your data to a JSON file or restore from a previous
                    backup.
                </p>
            </div>

            {/* Backup section */}
            <div className='bg-white shadow rounded-lg p-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-1'>
                    Export Backup
                </h2>
                <p className='text-sm text-gray-500 mb-4'>
                    Downloads a JSON file containing all your categories,
                    transactions, investments, heritage, retirement accounts,
                    and rules.
                </p>
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {loading ? (
                        <svg
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
                        '⬇️'
                    )}
                    Download Backup
                </button>
            </div>

            {/* Restore section */}
            <div className='bg-white shadow rounded-lg p-6 space-y-4'>
                <h2 className='text-lg font-medium text-gray-900'>
                    Restore from Backup
                </h2>
                <p className='text-sm text-gray-500'>
                    Upload a <code>.json</code> backup file exported from this
                    application. Duplicate transactions (same reference ID) will
                    be skipped automatically.
                </p>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Backup file
                    </label>
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='.json'
                        onChange={handleFileSelect}
                        className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                    />
                </div>

                {/* Replace existing toggle */}
                <div className='rounded-md bg-yellow-50 border border-yellow-200 p-4 space-y-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={replaceExisting}
                            onChange={(e) => {
                                setReplaceExisting(e.target.checked);
                                setConfirmReplace(false);
                            }}
                            className='h-4 w-4 rounded border-gray-300 text-red-600'
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
                                onChange={(e) =>
                                    setConfirmReplace(e.target.checked)
                                }
                                className='h-4 w-4 rounded border-red-400 text-red-600'
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
                    disabled={loading || !selectedFile}
                    className='inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {loading ? (
                        <svg
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
                        '⬆️'
                    )}
                    Restore Backup
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className='rounded-md bg-red-50 border border-red-200 p-4'>
                    <p className='text-sm text-red-700'>❌ {error}</p>
                </div>
            )}

            {/* Success result */}
            {restoreResult && (
                <div className='rounded-md bg-green-50 border border-green-200 p-4 space-y-3'>
                    <p className='text-sm font-medium text-green-800'>
                        ✅ {restoreResult.message}
                    </p>
                    <table className='min-w-full text-sm'>
                        <tbody>
                            {Object.entries(restoreResult.summary).map(
                                ([key, value]) => (
                                    <tr key={key}>
                                        <td className='pr-4 py-0.5 capitalize text-gray-600'>
                                            {key.replace(/_/g, ' ')}
                                        </td>
                                        <td className='font-semibold text-gray-900'>
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
};

export default DatabaseBackup;
