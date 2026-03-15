import React, { useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    fetchTransactions,
    uploadBankStatement,
} from '../store/slices/transactionsSlice';
import Modal from './Modal';

interface TransactionResult {
    id?: number;
    row?: number;
    date: string;
    description: string;
    amount: number;
    category?: string;
    reason?: string;
}

interface UploadResult {
    message: string;
    transactions_created: TransactionResult[];
    transactions_skipped: TransactionResult[];
    errors: string[];
    summary: {
        created: number;
        skipped: number;
        errors: number;
    };
}

const BankStatementUpload: React.FC<{ accountId?: number }> = ({
    accountId,
}) => {
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.transactions);
    const [showModal, setShowModal] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            alert('Please select a CSV file');
            return;
        }

        try {
            const result = await dispatch(
                uploadBankStatement({ file, accountId })
            ).unwrap();
            setUploadResult(result);
            setShowModal(true);

            // Refresh transactions and categories list
            dispatch(fetchTransactions({}));
            dispatch(fetchCategories());
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file. Please try again.');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        const file = files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const file = files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const closeModal = () => {
        setShowModal(false);
        setUploadResult(null);
    };

    return (
        <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-3'>
                <div className='flex items-center gap-4'>
                    {/* Drop zone */}
                    <div
                        className={`flex-1 border-2 border-dashed rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            dragActive
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={handleClick}
                    >
                        <svg
                            className='h-6 w-6 text-gray-400 flex-shrink-0'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                            />
                        </svg>
                        <div className='min-w-0'>
                            <p className='text-sm font-medium text-gray-700'>
                                {loading
                                    ? 'Uploading…'
                                    : 'Drop CSV here or click to browse'}
                            </p>
                            <p className='text-xs text-gray-400 truncate'>
                                Credit Card: Date,Description,Amount &nbsp;|
                                &nbsp; Account: Details,PostingDate,Amount,Type
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='.csv'
                            onChange={handleFileInputChange}
                            className='hidden'
                        />
                    </div>

                    {/* Upload button */}
                    <button
                        type='button'
                        onClick={handleClick}
                        disabled={loading}
                        className='flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        {loading ? 'Uploading…' : 'Upload CSV'}
                    </button>
                </div>

                {error && (
                    <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded-md'>
                        <p className='text-sm text-red-600'>{error}</p>
                    </div>
                )}
            </div>

            {/* Upload Result Modal */}
            <Modal isOpen={showModal} onClose={closeModal}>
                <div className='max-w-2xl w-full'>
                    <h2 className='text-xl font-bold mb-4'>Upload Results</h2>

                    {uploadResult && (
                        <div className='space-y-4'>
                            <div className='bg-green-50 border border-green-200 rounded-md p-4'>
                                <p className='text-green-800'>
                                    {uploadResult.message}
                                </p>
                            </div>

                            <div className='grid grid-cols-3 gap-4'>
                                <div className='bg-blue-50 border border-blue-200 rounded-md p-4 text-center'>
                                    <div className='text-2xl font-bold text-blue-600'>
                                        {uploadResult.summary.created}
                                    </div>
                                    <div className='text-sm text-blue-800'>
                                        Created
                                    </div>
                                </div>
                                <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center'>
                                    <div className='text-2xl font-bold text-yellow-600'>
                                        {uploadResult.summary.skipped}
                                    </div>
                                    <div className='text-sm text-yellow-800'>
                                        Skipped
                                    </div>
                                </div>
                                <div className='bg-red-50 border border-red-200 rounded-md p-4 text-center'>
                                    <div className='text-2xl font-bold text-red-600'>
                                        {uploadResult.summary.errors}
                                    </div>
                                    <div className='text-sm text-red-800'>
                                        Errors
                                    </div>
                                </div>
                            </div>

                            {uploadResult.transactions_created.length > 0 && (
                                <div>
                                    <h3 className='font-medium text-gray-900 mb-2'>
                                        Transactions Created:
                                    </h3>
                                    <div className='max-h-40 overflow-y-auto bg-gray-50 rounded-md p-2'>
                                        {uploadResult.transactions_created
                                            .slice(0, 10)
                                            .map((tx, index) => (
                                                <div
                                                    key={index}
                                                    className='text-sm text-gray-600 py-1'
                                                >
                                                    {tx.date} - {tx.description}{' '}
                                                    - ${tx.amount}
                                                </div>
                                            ))}
                                        {uploadResult.transactions_created
                                            .length > 10 && (
                                            <div className='text-sm text-gray-500 mt-2'>
                                                ... and{' '}
                                                {uploadResult
                                                    .transactions_created
                                                    .length - 10}{' '}
                                                more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {uploadResult.transactions_skipped.length > 0 && (
                                <div>
                                    <h3 className='font-medium text-yellow-900 mb-2'>
                                        Transactions Skipped:
                                    </h3>
                                    <div className='max-h-40 overflow-y-auto bg-yellow-50 rounded-md p-2'>
                                        {uploadResult.transactions_skipped.map(
                                            (tx, index) => (
                                                <div
                                                    key={index}
                                                    className='text-sm text-yellow-700 py-1'
                                                >
                                                    Row {tx.row}:{' '}
                                                    {tx.description} -{' '}
                                                    {tx.reason}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {uploadResult.errors.length > 0 && (
                                <div>
                                    <h3 className='font-medium text-red-900 mb-2'>
                                        Errors:
                                    </h3>
                                    <div className='max-h-40 overflow-y-auto bg-red-50 rounded-md p-2'>
                                        {uploadResult.errors.map(
                                            (error, index) => (
                                                <div
                                                    key={index}
                                                    className='text-sm text-red-600 py-1'
                                                >
                                                    {error}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className='flex justify-end pt-4'>
                                <button
                                    onClick={closeModal}
                                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default BankStatementUpload;
