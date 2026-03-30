import { useCallback, useEffect, useMemo, useState } from 'react';

import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import RuleConditionBuilder from '../components/RuleConditionBuilder';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    bulkExecuteReclassificationRules,
    createCategoryDeletionRule,
    createReclassificationRule,
    deleteCategoryDeletionRule,
    deleteReclassificationRule,
    fetchCategoryDeletionRules,
    fetchReclassificationRules,
    previewReclassificationRule,
} from '../store/slices/cleanAndReclassifySlice';
import {
    bulkDeleteTransactions,
    fetchTransactions,
} from '../store/slices/transactionsSlice';
import type { ReclassificationConditions } from '../types/cleanAndReclassify';

interface PreviewTransaction {
    id: number;
    date: string;
    amount: string;
    description: string;
    category: number;
    category_name: string;
}

interface PreviewData {
    matching_count: number;
    transactions: PreviewTransaction[];
    rule_name: string;
    from_category_name: string;
    to_category_name: string;
}

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
    const [ruleName, setRuleName] = useState('');
    const [conditions, setConditions] = useState<ReclassificationConditions>(
        {}
    );
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [ruleFormError, setRuleFormError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchReclassificationRules());
        dispatch(fetchCategoryDeletionRules());
    }, [dispatch]);

    const availableCategories = useMemo(
        () => categories.filter((cat) => cat.name),
        [categories]
    );

    const deletionCategoryIds = useMemo(
        () => new Set(categoryDeletionRules.map((r) => r.category)),
        [categoryDeletionRules]
    );

    const handleAddReclassificationRule = useCallback(async () => {
        setRuleFormError(null);
        if (!selectedToCategory) {
            setRuleFormError('Please select a target category');
            return;
        }

        if (
            selectedFromCategory &&
            selectedFromCategory === selectedToCategory
        ) {
            setRuleFormError('Cannot reclassify to the same category');
            return;
        }

        try {
            await dispatch(
                createReclassificationRule({
                    from_category: selectedFromCategory
                        ? Number(selectedFromCategory)
                        : null,
                    to_category: Number(selectedToCategory),
                    conditions:
                        Object.keys(conditions).length > 0
                            ? conditions
                            : undefined,
                    rule_name: ruleName.trim() || undefined,
                })
            ).unwrap();

            setSelectedFromCategory('');
            setSelectedToCategory('');
            setRuleName('');
            setConditions({});
        } catch (error) {
            console.error('Failed to create reclassification rule:', error);
            setRuleFormError(
                'Failed to save reclassification rule. Please try again.'
            );
        }
    }, [
        dispatch,
        selectedFromCategory,
        selectedToCategory,
        conditions,
        ruleName,
    ]);

    const handleRemoveReclassificationRule = useCallback(
        async (ruleId: number) => {
            try {
                await dispatch(deleteReclassificationRule(ruleId)).unwrap();
            } catch (error) {
                console.error('Failed to delete reclassification rule:', error);
                setActionError(
                    'Failed to delete reclassification rule. Please try again.'
                );
            }
        },
        [dispatch]
    );

    const handlePreviewRule = useCallback(
        async (ruleId: number) => {
            setPreviewData(null);
            setIsLoadingPreview(true);
            setShowPreviewModal(true);
            try {
                const result = await dispatch(
                    previewReclassificationRule(ruleId)
                ).unwrap();
                setPreviewData(result);
            } catch (error) {
                console.error('Failed to preview rule:', error);
                setShowPreviewModal(false);
                setActionError('Failed to preview rule. Please try again.');
            } finally {
                setIsLoadingPreview(false);
            }
        },
        [dispatch]
    );

    const handleToggleDeleteCategory = useCallback(
        async (categoryId: number) => {
            const existingRule = categoryDeletionRules.find(
                (rule) => rule.category === categoryId
            );

            try {
                if (existingRule) {
                    await dispatch(
                        deleteCategoryDeletionRule(existingRule.id)
                    ).unwrap();
                } else {
                    await dispatch(
                        createCategoryDeletionRule({ category: categoryId })
                    ).unwrap();
                }
            } catch (error) {
                console.error('Failed to update deletion rule:', error);
                setActionError(
                    'Failed to update deletion rule. Please try again.'
                );
            }
        },
        [dispatch, categoryDeletionRules]
    );

    const handleExecuteOperations = useCallback(async () => {
        setShowConfirmModal(false);
        setIsProcessing(true);

        const messages: string[] = [];
        let totalReclassified = 0;
        let totalDeleted = 0;

        // Execute reclassification rules (bulk operation for performance)
        if (reclassificationRules.length > 0) {
            try {
                const ruleIds = reclassificationRules.map((rule) => rule.id);
                const result = await dispatch(
                    bulkExecuteReclassificationRules(ruleIds)
                ).unwrap();
                totalReclassified = result.total_transactions_updated;
            } catch (error) {
                console.error('Failed to apply reclassification rules:', error);
                messages.push('❌ Failed to apply reclassification rules.');
            }
        }

        // Execute deletion
        if (categoryDeletionRules.length > 0) {
            try {
                const categoryIds = categoryDeletionRules.map(
                    (rule) => rule.category
                );
                const result = await dispatch(
                    bulkDeleteTransactions({ category_ids: categoryIds })
                ).unwrap();
                totalDeleted = result.transactions_deleted;
            } catch (error) {
                console.error('Failed to delete transactions:', error);
                messages.push('❌ Failed to delete transactions.');
            }
        }

        // Refresh transactions (non-critical)
        try {
            await dispatch(fetchTransactions({}));
        } catch {
            // Silent — refresh failure doesn't affect reported results
        }

        if (totalReclassified > 0) {
            messages.unshift(
                `✅ ${totalReclassified} transaction(s) reclassified`
            );
        }
        if (totalDeleted > 0) {
            messages.unshift(`🗑️ ${totalDeleted} transaction(s) deleted`);
        }
        if (messages.length === 0) {
            messages.push(
                'No operations were completed. Check if your rules match any transactions.'
            );
        }

        setSuccessMessage(messages);
        setShowSuccessModal(true);
        setIsProcessing(false);
    }, [dispatch, reclassificationRules, categoryDeletionRules]);

    const hasOperations =
        reclassificationRules.length > 0 || categoryDeletionRules.length > 0;

    const handleCloseSuccessModal = useCallback(
        () => setShowSuccessModal(false),
        []
    );
    const handleClosePreviewModal = useCallback(
        () => setShowPreviewModal(false),
        []
    );
    const handleCloseConfirmModal = useCallback(
        () => setShowConfirmModal(false),
        []
    );
    const handleOpenConfirmModal = useCallback(
        () => setShowConfirmModal(true),
        []
    );

    return (
        <div className='pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        <span aria-hidden='true'>🧹</span> Clean and Reclassify
                    </h1>
                    <p className='text-gray-600'>
                        Set up reclassification rules and select categories to
                        delete transactions. All operations will be executed at
                        once.
                    </p>
                </div>

                {actionError && (
                    <div
                        role='alert'
                        className='mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-md p-3'
                    >
                        <p className='text-sm text-red-700'>{actionError}</p>
                        <button
                            onClick={() => setActionError(null)}
                            aria-label='Dismiss error'
                            className='ml-2 text-red-500 hover:text-red-700 font-bold'
                        >
                            &times;
                        </button>
                    </div>
                )}

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Reclassification Section */}
                    <div className='card bg-base-100 shadow-sm p-6'>
                        <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
                            <span className='text-2xl mr-2' aria-hidden='true'>
                                🔄
                            </span>
                            Reclassification Rules
                        </h2>
                        <p className='text-sm text-gray-600 mb-4'>
                            Create rules to reclassify transactions with
                            advanced conditions.
                        </p>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium mb-1'>
                                    Rule Name (Optional)
                                </label>
                                <input
                                    type='text'
                                    value={ruleName}
                                    onChange={(e) =>
                                        setRuleName(e.target.value)
                                    }
                                    placeholder='e.g., Groceries from Walmart'
                                    className='w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium mb-1'>
                                    From Category (Optional)
                                    <span className='ml-2 text-xs text-gray-500'>
                                        Leave empty to match all categories
                                    </span>
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
                                    className='w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                >
                                    <option value=''>All Categories</option>
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
                                <label className='block text-sm font-medium mb-1'>
                                    To Category (Required)
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
                                    className='w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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

                            <RuleConditionBuilder
                                conditions={conditions}
                                onChange={setConditions}
                            />

                            <button
                                onClick={handleAddReclassificationRule}
                                disabled={!selectedToCategory}
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <span aria-hidden='true'>➕</span> Add Rule
                            </button>
                            {ruleFormError && (
                                <p
                                    role='alert'
                                    className='text-sm text-error mt-2'
                                >
                                    {ruleFormError}
                                </p>
                            )}
                        </div>

                        {/* Rules List */}
                        {reclassificationRules.length > 0 && (
                            <div className='mt-6'>
                                <h3 className='text-sm font-semibold text-gray-700 mb-2'>
                                    Active Rules ({reclassificationRules.length}
                                    )
                                </h3>
                                <div className='space-y-3'>
                                    {reclassificationRules.map((rule) => {
                                        const hasConditions =
                                            rule.conditions &&
                                            Object.keys(rule.conditions)
                                                .length > 0;
                                        return (
                                            <div
                                                key={rule.id}
                                                className='bg-blue-50 p-3 rounded-md border border-blue-200'
                                            >
                                                <div className='flex items-start justify-between'>
                                                    <div className='flex-1'>
                                                        {rule.rule_name && (
                                                            <div className='text-sm font-semibold text-gray-800 mb-1'>
                                                                {rule.rule_name}
                                                            </div>
                                                        )}
                                                        <div className='flex items-center space-x-2 text-sm'>
                                                            <span className='font-medium'>
                                                                {rule.from_category_name ??
                                                                    'All Categories'}
                                                            </span>
                                                            <span className='text-primary'>
                                                                →
                                                            </span>
                                                            <span className='font-medium'>
                                                                {
                                                                    rule.to_category_name
                                                                }
                                                            </span>
                                                        </div>
                                                        {hasConditions && (
                                                            <div className='mt-2 text-xs text-gray-600 space-y-1'>
                                                                {rule.conditions
                                                                    ?.description_contains &&
                                                                    rule
                                                                        .conditions
                                                                        .description_contains
                                                                        .length >
                                                                        0 && (
                                                                        <div>
                                                                            <span className='font-medium'>
                                                                                Contains:
                                                                            </span>{' '}
                                                                            {rule.conditions.description_contains.join(
                                                                                ', '
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                {rule.conditions
                                                                    ?.description_not_contains &&
                                                                    rule
                                                                        .conditions
                                                                        .description_not_contains
                                                                        .length >
                                                                        0 && (
                                                                        <div>
                                                                            <span className='font-medium'>
                                                                                Excludes:
                                                                            </span>{' '}
                                                                            {rule.conditions.description_not_contains.join(
                                                                                ', '
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                {(rule
                                                                    .conditions
                                                                    ?.amount_min ||
                                                                    rule
                                                                        .conditions
                                                                        ?.amount_max) && (
                                                                    <div>
                                                                        <span className='font-medium'>
                                                                            Amount:
                                                                        </span>{' '}
                                                                        {rule
                                                                            .conditions
                                                                            ?.amount_min &&
                                                                            `≥ $${rule.conditions.amount_min}`}
                                                                        {rule
                                                                            .conditions
                                                                            ?.amount_min &&
                                                                            rule
                                                                                .conditions
                                                                                ?.amount_max &&
                                                                            ' and '}
                                                                        {rule
                                                                            .conditions
                                                                            ?.amount_max &&
                                                                            `≤ $${rule.conditions.amount_max}`}
                                                                    </div>
                                                                )}
                                                                {(rule
                                                                    .conditions
                                                                    ?.date_from ||
                                                                    rule
                                                                        .conditions
                                                                        ?.date_to) && (
                                                                    <div>
                                                                        <span className='font-medium'>
                                                                            Date:
                                                                        </span>{' '}
                                                                        {rule
                                                                            .conditions
                                                                            ?.date_from &&
                                                                            `from ${rule.conditions.date_from}`}
                                                                        {rule
                                                                            .conditions
                                                                            ?.date_from &&
                                                                            rule
                                                                                .conditions
                                                                                ?.date_to &&
                                                                            ' '}
                                                                        {rule
                                                                            .conditions
                                                                            ?.date_to &&
                                                                            `to ${rule.conditions.date_to}`}
                                                                    </div>
                                                                )}
                                                                {rule.conditions
                                                                    ?.transaction_type && (
                                                                    <div>
                                                                        <span className='font-medium'>
                                                                            Type:
                                                                        </span>{' '}
                                                                        {
                                                                            rule
                                                                                .conditions
                                                                                .transaction_type
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='flex items-center gap-2 ml-2'>
                                                        <button
                                                            onClick={() =>
                                                                handlePreviewRule(
                                                                    rule.id
                                                                )
                                                            }
                                                            aria-label={`Preview rule: ${
                                                                rule.rule_name ??
                                                                rule.to_category_name
                                                            }`}
                                                            className='text-primary hover:text-blue-800 transition-colors text-sm font-medium'
                                                            title='Preview matching transactions'
                                                        >
                                                            <span aria-hidden='true'>
                                                                👁️
                                                            </span>{' '}
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveReclassificationRule(
                                                                    rule.id
                                                                )
                                                            }
                                                            aria-label={`Delete rule: ${
                                                                rule.rule_name ??
                                                                rule.to_category_name
                                                            }`}
                                                            className='text-error hover:text-red-800 transition-colors'
                                                            title='Delete rule'
                                                        >
                                                            <span aria-hidden='true'>
                                                                🗑️
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deletion Section */}
                    <div className='card bg-base-100 shadow-sm p-6'>
                        <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
                            <span className='text-2xl mr-2' aria-hidden='true'>
                                🗑️
                            </span>
                            Delete Transactions
                        </h2>
                        <p className='text-sm text-gray-600 mb-4'>
                            Select categories to delete all their transactions.
                        </p>

                        <div className='max-h-96 overflow-y-auto space-y-2 border border-base-300 rounded-md p-3'>
                            {availableCategories.length === 0 ? (
                                <p className='text-gray-400 text-sm text-center py-4'>
                                    No categories available
                                </p>
                            ) : (
                                availableCategories.map((category) => (
                                    <label
                                        key={category.id}
                                        className='flex items-center space-x-3 cursor-pointer p-2 rounded transition-colors'
                                    >
                                        <input
                                            type='checkbox'
                                            checked={deletionCategoryIds.has(
                                                category.id
                                            )}
                                            onChange={() =>
                                                handleToggleDeleteCategory(
                                                    category.id
                                                )
                                            }
                                            className='checkbox checkbox-error checkbox-sm'
                                        />
                                        <span>{category.name}</span>
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
                    <div className='mt-8 bg-gradient-to-r from-blue-50 to-red-50 shadow-lg rounded-lg p-6 border-2 border-base-300'>
                        <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                            📋 Operations Summary
                        </h3>
                        <div className='space-y-2 text-sm opacity-70 mb-4'>
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
                            onClick={handleOpenConfirmModal}
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
                                <>
                                    <span aria-hidden='true'>🧹</span> Execute
                                    Clean and Reclassify
                                </>
                            )}
                        </button>
                    </div>
                )}

                {!hasOperations && (
                    <div className='mt-8 bg-base-200 rounded-lg p-8 text-center'>
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
                onClose={handleCloseConfirmModal}
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
                onClose={handleCloseSuccessModal}
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
                            onClick={handleCloseSuccessModal}
                            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors'
                        >
                            OK
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreviewModal}
                onClose={handleClosePreviewModal}
                title={`Preview: ${
                    previewData?.rule_name || 'Reclassification Rule'
                }`}
            >
                <div className='space-y-4'>
                    {isLoadingPreview ? (
                        <div className='text-center py-8'>
                            <div className='animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto'></div>
                            <p className='mt-4 text-gray-600'>
                                Loading preview...
                            </p>
                        </div>
                    ) : previewData ? (
                        <>
                            <div className='bg-blue-50 p-4 rounded-md border border-blue-200'>
                                <p className='text-lg font-semibold text-blue-900'>
                                    {previewData.matching_count}{' '}
                                    {previewData.matching_count === 1
                                        ? 'transaction'
                                        : 'transactions'}{' '}
                                    will be reclassified
                                </p>
                                <p className='text-sm text-gray-600 mt-1'>
                                    From:{' '}
                                    <strong>
                                        {previewData.from_category_name}
                                    </strong>{' '}
                                    → To:{' '}
                                    <strong>
                                        {previewData.to_category_name}
                                    </strong>
                                </p>
                            </div>

                            {previewData.matching_count > 0 ? (
                                <>
                                    <div className='max-h-96 overflow-y-auto border border-base-300 rounded-md'>
                                        <table className='table table-zebra w-full'>
                                            <thead className='sticky top-0 bg-base-100'>
                                                <tr>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                                                        Date
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                                                        Description
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                                                        Category
                                                    </th>
                                                    <th className='px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase'>
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.transactions.map(
                                                    (
                                                        txn: PreviewTransaction
                                                    ) => (
                                                        <tr
                                                            key={txn.id}
                                                            className=''
                                                        >
                                                            <td className='px-3 py-2 text-sm text-gray-900 whitespace-nowrap'>
                                                                {new Date(
                                                                    txn.date
                                                                ).toLocaleDateString()}
                                                            </td>
                                                            <td className='px-3 py-2 text-sm opacity-70'>
                                                                {
                                                                    txn.description
                                                                }
                                                            </td>
                                                            <td className='px-3 py-2 text-sm text-gray-600'>
                                                                {
                                                                    txn.category_name
                                                                }
                                                            </td>
                                                            <td className='px-3 py-2 text-sm text-right text-gray-900 font-medium'>
                                                                $
                                                                {parseFloat(
                                                                    txn.amount
                                                                ).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {previewData.matching_count > 50 && (
                                        <p className='text-xs text-gray-500 italic'>
                                            Showing first 50 of{' '}
                                            {previewData.matching_count}{' '}
                                            matching transactions
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className='text-center py-8 text-gray-500'>
                                    <p className='text-lg'>
                                        No matching transactions found
                                    </p>
                                    <p className='text-sm mt-2'>
                                        Try adjusting your rule conditions
                                    </p>
                                </div>
                            )}

                            <div className='flex justify-end gap-3 mt-6'>
                                <button
                                    onClick={handleClosePreviewModal}
                                    className='px-4 py-2 border border-base-300 rounded-md text-gray-700 transition-colors'
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
}

export default CleanAndReclassify;
