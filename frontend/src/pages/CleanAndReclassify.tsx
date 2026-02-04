import { useEffect, useState } from 'react';

import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    createCategoryDeletionRule,
    createReclassificationRule,
    deleteCategoryDeletionRule,
    deleteReclassificationRule,
    fetchCategoryDeletionRules,
    fetchReclassificationRules,
} from '../store/slices/cleanAndReclassifySlice';
import {
    bulkDeleteTransactions,
    bulkReclassifyTransactions,
    fetchTransactions,
} from '../store/slices/transactionsSlice';

function CleanAndReclassify() {
    const dispatch = useAppDispatch();
    const { categories, loading: categoriesLoading } = useAppSelector(
        (state) => state.categories
    );
    const { reclassificationRules, categoryDeletionRules } = useAppSelector(
        (state) => state.cleanAndReclassify
    );

    // UI state
    const [selectedFromCategory, setSelectedFromCategory] = useState<
        number | ''
    >('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string[]>([]);
    const [selectedToCategory, setSelectedToCategory] = useState<number | ''>(
        ''
    );
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchReclassificationRules());
        dispatch(fetchCategoryDeletionRules());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchReclassificationRules());
        dispatch(fetchCategoryDeletionRules());
    }, [dispatch]);

    const availableCategories = categories.filter((cat) => cat.name);

    const handleAddReclassificationRule = async () => {
        if (
            selectedFromCategory &&
            selectedToCategory &&
            selectedFromCategory !== selectedToCategory
        ) {
            const fromCategory = categories.find(
                (c) => c.id === Number(selectedFromCategory)
            );
            const toCategory = categories.find(
                (c) => c.id === Number(selectedToCategory)
            );

            if (fromCategory && toCategory) {
                // Check if rule already exists
                const exists = reclassificationRules.some(
                    (rule) =>
                        rule.from_category === Number(selectedFromCategory)
                );

                if (exists) {
                    alert(
                        `A reclassification rule for "${fromCategory.name}" already exists.`
                    );
                    return;
                }

                try {
                    await dispatch(
                        createReclassificationRule({
                            from_category: Number(selectedFromCategory),
                            to_category: Number(selectedToCategory),
                        })
                    ).unwrap();

                    setSelectedFromCategory('');
                    setSelectedToCategory('');
                } catch (error) {
                    console.error(
                        'Failed to create reclassification rule:',
                        error
                    );
                    alert('Failed to save reclassification rule.');
                }
            }
        }
    };

    const handleRemoveReclassificationRule = async (ruleId: number) => {
        try {
            await dispatch(deleteReclassificationRule(ruleId)).unwrap();
        } catch (error) {
            console.error('Failed to delete reclassification rule:', error);
            alert('Failed to delete reclassification rule.');
        }
    };

    const handleToggleDeleteCategory = async (categoryId: number) => {
        const existingRule = categoryDeletionRules.find(
            (rule) => rule.category === categoryId
        );

        if (existingRule) {
            // Remove the rule
            try {
                await dispatch(
                    deleteCategoryDeletionRule(existingRule.id)
                ).unwrap();
            } catch (error) {
                console.error('Failed to remove deletion rule:', error);
                alert('Failed to remove deletion rule.');
            }
        } else {
            // Add the rule
            try {
                await dispatch(
                    createCategoryDeletionRule({
                        category: categoryId,
                    })
                ).unwrap();
            } catch (error) {
                console.error('Failed to create deletion rule:', error);
                alert('Failed to create deletion rule.');
            }
        }
    };

    const handleExecuteOperations = async () => {
        if (
            reclassificationRules.length === 0 &&
            categoryDeletionRules.length === 0
        ) {
            alert(
                'Please add at least one reclassification rule or select categories to delete.'
            );
            return;
        }

        setShowConfirmModal(false);
        setIsProcessing(true);

        try {
            let totalReclassified = 0;
            let totalDeleted = 0;

            // Execute reclassification rules
            for (const rule of reclassificationRules) {
                try {
                    const result = await dispatch(
                        bulkReclassifyTransactions({
                            from_category_id: rule.from_category,
                            to_category_id: rule.to_category,
                        })
                    ).unwrap();
                    totalReclassified += result.transactions_updated;
                } catch (error) {
                    console.error(
                        `Failed to reclassify from category ${rule.from_category}:`,
                        error
                    );
                }
            }

            // Execute deletion
            if (categoryDeletionRules.length > 0) {
                try {
                    const categoryIds = categoryDeletionRules.map(
                        (rule) => rule.category
                    );
                    const result = await dispatch(
                        bulkDeleteTransactions({
                            category_ids: categoryIds,
                        })
                    ).unwrap();
                    totalDeleted = result.transactions_deleted;
                } catch (error) {
                    console.error('Failed to delete transactions:', error);
                }
            }

            // Refresh transactions
            await dispatch(fetchTransactions({}));

            // Show success message
            const messages = [];
            if (totalReclassified > 0) {
                messages.push(
                    `✅ ${totalReclassified} transaction(s) reclassified`
                );
            }
            if (totalDeleted > 0) {
                messages.push(`🗑️ ${totalDeleted} transaction(s) deleted`);
            }

            setSuccessMessage(messages);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Failed to execute operations:', error);
            setSuccessMessage([
                '❌ Some operations failed. Please check the console for details.',
            ]);
            setShowSuccessModal(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const getCategoryName = (categoryId: number) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name || 'Unknown';
    };

    const hasOperations =
        reclassificationRules.length > 0 || categoryDeletionRules.length > 0;

    const isCategorySelectedForDeletion = (categoryId: number) => {
        return categoryDeletionRules.some(
            (rule) => rule.category === categoryId
        );
    };

    return (
        <div className='pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        🧹 Clean and Reclassify
                    </h1>
                    <p className='text-gray-600'>
                        Set up reclassification rules and select categories to
                        delete transactions. All operations will be executed at
                        once.
                    </p>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Reclassification Section */}
                    <div className='bg-white shadow-md rounded-lg p-6'>
                        <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
                            <span className='text-2xl mr-2'>🔄</span>
                            Reclassification Rules
                        </h2>
                        <p className='text-sm text-gray-600 mb-4'>
                            Move all transactions from one category to another.
                        </p>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    From Category
                                </label>
                                <select
                                    value={selectedFromCategory}
                                    onChange={(e) =>
                                        setSelectedFromCategory(
                                            e.target.value
                                                ? Number(e.target.value)
                                                : ''
                                        )
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                >
                                    <option value=''>
                                        Select category to move from...
                                    </option>
                                    {availableCategories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    To Category
                                </label>
                                <select
                                    value={selectedToCategory}
                                    onChange={(e) =>
                                        setSelectedToCategory(
                                            e.target.value
                                                ? Number(e.target.value)
                                                : ''
                                        )
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                >
                                    <option value=''>
                                        Select target category...
                                    </option>
                                    {availableCategories
                                        .filter(
                                            (cat) =>
                                                cat.id !==
                                                Number(selectedFromCategory)
                                        )
                                        .map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <button
                                onClick={handleAddReclassificationRule}
                                disabled={
                                    !selectedFromCategory ||
                                    !selectedToCategory ||
                                    selectedFromCategory === selectedToCategory
                                }
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                ➕ Add Rule
                            </button>
                        </div>

                        {/* Rules List */}
                        {reclassificationRules.length > 0 && (
                            <div className='mt-6'>
                                <h3 className='text-sm font-semibold text-gray-700 mb-2'>
                                    Active Rules ({reclassificationRules.length}
                                    )
                                </h3>
                                <div className='space-y-2'>
                                    {reclassificationRules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className='flex items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-200'
                                        >
                                            <div className='flex items-center space-x-2 text-sm'>
                                                <span className='font-medium text-gray-700'>
                                                    {getCategoryName(
                                                        rule.from_category
                                                    )}
                                                </span>
                                                <span className='text-blue-600'>
                                                    →
                                                </span>
                                                <span className='font-medium text-gray-700'>
                                                    {getCategoryName(
                                                        rule.to_category
                                                    )}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleRemoveReclassificationRule(
                                                        rule.id
                                                    )
                                                }
                                                className='text-red-600 hover:text-red-800 transition-colors'
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deletion Section */}
                    <div className='bg-white shadow-md rounded-lg p-6'>
                        <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
                            <span className='text-2xl mr-2'>🗑️</span>
                            Delete Transactions
                        </h2>
                        <p className='text-sm text-gray-600 mb-4'>
                            Select categories to delete all their transactions.
                        </p>

                        <div className='max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3'>
                            {availableCategories.length === 0 ? (
                                <p className='text-gray-400 text-sm text-center py-4'>
                                    No categories available
                                </p>
                            ) : (
                                availableCategories.map((category) => (
                                    <label
                                        key={category.id}
                                        className='flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors'
                                    >
                                        <input
                                            type='checkbox'
                                            checked={isCategorySelectedForDeletion(
                                                category.id
                                            )}
                                            onChange={() =>
                                                handleToggleDeleteCategory(
                                                    category.id
                                                )
                                            }
                                            className='w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 focus:ring-2'
                                        />
                                        <span className='text-gray-700'>
                                            {category.name}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>

                        {categoryDeletionRules.length > 0 && (
                            <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                                <p className='text-sm text-red-700'>
                                    ⚠️ {categoryDeletionRules.length}{' '}
                                    category(ies) selected for deletion
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary and Execute Button */}
                {hasOperations && (
                    <div className='mt-8 bg-gradient-to-r from-blue-50 to-red-50 shadow-lg rounded-lg p-6 border-2 border-gray-200'>
                        <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                            📋 Operations Summary
                        </h3>
                        <div className='space-y-2 text-sm text-gray-700 mb-4'>
                            {reclassificationRules.length > 0 && (
                                <p>
                                    •{' '}
                                    <strong>
                                        {reclassificationRules.length}
                                    </strong>{' '}
                                    reclassification rule(s) will be applied
                                </p>
                            )}
                            {categoryDeletionRules.length > 0 && (
                                <p>
                                    • Transactions from{' '}
                                    <strong>
                                        {categoryDeletionRules.length}
                                    </strong>{' '}
                                    category(ies) will be deleted
                                </p>
                            )}
                        </div>

                        <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4'>
                            <div className='flex'>
                                <div className='flex-shrink-0'>
                                    <span className='text-xl'>⚠️</span>
                                </div>
                                <div className='ml-3'>
                                    <p className='text-sm text-yellow-700'>
                                        <strong>Warning:</strong> This operation
                                        may take several minutes depending on
                                        the number of transactions. All changes
                                        are permanent and cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isProcessing || categoriesLoading}
                            className='w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-bold px-6 py-4 rounded-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg'
                        >
                            {isProcessing ? (
                                <span className='flex items-center justify-center'>
                                    <svg
                                        className='animate-spin h-5 w-5 mr-3'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                            fill='none'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                    Processing... Please wait
                                </span>
                            ) : (
                                '🧹 Execute Clean and Reclassify'
                            )}
                        </button>
                    </div>
                )}

                {!hasOperations && (
                    <div className='mt-8 bg-gray-50 rounded-lg p-8 text-center'>
                        <p className='text-gray-500 text-lg'>
                            👆 Add reclassification rules or select categories
                            to delete to get started
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleExecuteOperations}
                title='Confirm Clean and Reclassify Operations'
                message={
                    <div className='space-y-3'>
                        <p className='font-semibold'>
                            You are about to execute the following operations:
                        </p>
                        {reclassificationRules.length > 0 && (
                            <div>
                                <p className='font-medium text-blue-700'>
                                    Reclassifications:
                                </p>
                                <ul className='list-disc list-inside ml-2 text-sm'>
                                    {reclassificationRules.map((rule) => (
                                        <li key={rule.id}>
                                            {rule.from_category_name} →{' '}
                                            {rule.to_category_name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {categoryDeletionRules.length > 0 && (
                            <div>
                                <p className='font-medium text-red-700'>
                                    Deletions ({categoryDeletionRules.length}{' '}
                                    categories):
                                </p>
                                <ul className='list-disc list-inside ml-2 text-sm'>
                                    {categoryDeletionRules.map((rule) => (
                                        <li key={rule.id}>
                                            {rule.category_name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className='text-sm text-gray-600 mt-4'>
                            This operation cannot be undone. Are you sure you
                            want to proceed?
                        </p>
                    </div>
                }
                confirmLabel='Yes, Execute Operations'
                cancelLabel='Cancel'
                isDanger={true}
                isConfirming={isProcessing}
            />

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title='Operations Completed Successfully!'
            >
                <div className='space-y-4'>
                    {successMessage.map((message, index) => (
                        <p key={index} className='text-lg'>
                            {message}
                        </p>
                    ))}
                    <div className='flex justify-end mt-6'>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors'
                        >
                            OK
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default CleanAndReclassify;
