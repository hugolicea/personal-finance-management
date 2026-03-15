import { useState } from 'react';

import type { ReclassificationConditions } from '../types/cleanAndReclassify';

interface RuleConditionBuilderProps {
    conditions: ReclassificationConditions;
    onChange: (conditions: ReclassificationConditions) => void;
}

function RuleConditionBuilder({
    conditions,
    onChange,
}: RuleConditionBuilderProps) {
    const [descriptionContainsInput, setDescriptionContainsInput] =
        useState('');
    const [descriptionNotContainsInput, setDescriptionNotContainsInput] =
        useState('');

    const handleAddDescriptionContains = () => {
        if (!descriptionContainsInput.trim()) return;

        const updated = {
            ...conditions,
            description_contains: [
                ...(conditions.description_contains || []),
                descriptionContainsInput.trim(),
            ],
        };
        onChange(updated);
        setDescriptionContainsInput('');
    };

    const handleRemoveDescriptionContains = (index: number) => {
        const updated = {
            ...conditions,
            description_contains: conditions.description_contains?.filter(
                (_, i) => i !== index
            ),
        };
        onChange(updated);
    };

    const handleAddDescriptionNotContains = () => {
        if (!descriptionNotContainsInput.trim()) return;

        const updated = {
            ...conditions,
            description_not_contains: [
                ...(conditions.description_not_contains || []),
                descriptionNotContainsInput.trim(),
            ],
        };
        onChange(updated);
        setDescriptionNotContainsInput('');
    };

    const handleRemoveDescriptionNotContains = (index: number) => {
        const updated = {
            ...conditions,
            description_not_contains:
                conditions.description_not_contains?.filter(
                    (_, i) => i !== index
                ),
        };
        onChange(updated);
    };

    const handleAmountChange = (
        field: 'amount_min' | 'amount_max',
        value: string
    ) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        onChange({
            ...conditions,
            [field]: numValue,
        });
    };

    const handleDateChange = (
        field: 'date_from' | 'date_to',
        value: string
    ) => {
        onChange({
            ...conditions,
            [field]: value || undefined,
        });
    };

    const handleTransactionTypeChange = (value: string) => {
        onChange({
            ...conditions,
            transaction_type: value
                ? (value as 'income' | 'expense')
                : undefined,
        });
    };

    const hasConditions =
        (conditions.description_contains?.length || 0) > 0 ||
        (conditions.description_not_contains?.length || 0) > 0 ||
        conditions.amount_min !== undefined ||
        conditions.amount_max !== undefined ||
        conditions.date_from !== undefined ||
        conditions.date_to !== undefined ||
        conditions.transaction_type !== undefined;

    return (
        <div className='space-y-4 border-t border-gray-200 pt-4 mt-4'>
            <div className='flex items-center justify-between'>
                <h3 className='text-sm font-medium text-gray-700'>
                    🎯 Advanced Conditions
                    {hasConditions && (
                        <span className='ml-2 text-xs text-blue-600 font-normal'>
                            (Active)
                        </span>
                    )}
                </h3>
            </div>

            {/* Description Contains */}
            <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Description Contains (any of these)
                </label>
                <div className='flex gap-2 mb-2'>
                    <input
                        type='text'
                        value={descriptionContainsInput}
                        onChange={(e) =>
                            setDescriptionContainsInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddDescriptionContains();
                            }
                        }}
                        placeholder='e.g., walmart, target'
                        className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                    <button
                        type='button'
                        onClick={handleAddDescriptionContains}
                        className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                    >
                        Add
                    </button>
                </div>
                {conditions.description_contains &&
                    conditions.description_contains.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                            {conditions.description_contains.map(
                                (text, index) => (
                                    <span
                                        key={index}
                                        className='inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded'
                                    >
                                        {text}
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleRemoveDescriptionContains(
                                                    index
                                                )
                                            }
                                            className='ml-1 text-green-600 hover:text-green-800'
                                        >
                                            ×
                                        </button>
                                    </span>
                                )
                            )}
                        </div>
                    )}
            </div>

            {/* Description NOT Contains */}
            <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Description Does NOT Contain
                </label>
                <div className='flex gap-2 mb-2'>
                    <input
                        type='text'
                        value={descriptionNotContainsInput}
                        onChange={(e) =>
                            setDescriptionNotContainsInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddDescriptionNotContains();
                            }
                        }}
                        placeholder='e.g., refund, return'
                        className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                    <button
                        type='button'
                        onClick={handleAddDescriptionNotContains}
                        className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                    >
                        Add
                    </button>
                </div>
                {conditions.description_not_contains &&
                    conditions.description_not_contains.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                            {conditions.description_not_contains.map(
                                (text, index) => (
                                    <span
                                        key={index}
                                        className='inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded'
                                    >
                                        {text}
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleRemoveDescriptionNotContains(
                                                    index
                                                )
                                            }
                                            className='ml-1 text-red-600 hover:text-red-800'
                                        >
                                            ×
                                        </button>
                                    </span>
                                )
                            )}
                        </div>
                    )}
            </div>

            {/* Amount Range */}
            <div className='grid grid-cols-2 gap-2'>
                <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>
                        Amount Min
                    </label>
                    <input
                        type='number'
                        step='0.01'
                        value={conditions.amount_min ?? ''}
                        onChange={(e) =>
                            handleAmountChange('amount_min', e.target.value)
                        }
                        placeholder='0.00'
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                </div>
                <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>
                        Amount Max
                    </label>
                    <input
                        type='number'
                        step='0.01'
                        value={conditions.amount_max ?? ''}
                        onChange={(e) =>
                            handleAmountChange('amount_max', e.target.value)
                        }
                        placeholder='999.99'
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                </div>
            </div>

            {/* Date Range */}
            <div className='grid grid-cols-2 gap-2'>
                <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>
                        Date From
                    </label>
                    <input
                        type='date'
                        value={conditions.date_from ?? ''}
                        onChange={(e) =>
                            handleDateChange('date_from', e.target.value)
                        }
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                </div>
                <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>
                        Date To
                    </label>
                    <input
                        type='date'
                        value={conditions.date_to ?? ''}
                        onChange={(e) =>
                            handleDateChange('date_to', e.target.value)
                        }
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                </div>
            </div>

            {/* Transaction Type */}
            <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Transaction Type
                </label>
                <select
                    value={conditions.transaction_type ?? ''}
                    onChange={(e) =>
                        handleTransactionTypeChange(e.target.value)
                    }
                    className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                    <option value=''>All Types</option>
                    <option value='income'>Income</option>
                    <option value='expense'>Expense</option>
                </select>
            </div>
        </div>
    );
}

export default RuleConditionBuilder;
