import React, { useState } from 'react';

import { Category } from '../types/categories';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

interface BulkOperationsProps {
    categories: Category[];
    onReclassify: (fromCategoryId: number, toCategoryId: number) => void;
    onDelete: (categoryIds: number[]) => void;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
    categories,
    onReclassify,
    onDelete,
}) => {
    const [isReclassifyModalOpen, setIsReclassifyModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fromCategoryId, setFromCategoryId] = useState<number | ''>('');
    const [toCategoryId, setToCategoryId] = useState<number | ''>('');
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<
        'reclassify' | 'delete' | null
    >(null);

    // Filter out categories that shouldn't be shown in dropdowns
    const availableCategories = categories.filter((cat) => cat.name);

    const handleReclassifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (fromCategoryId && toCategoryId && fromCategoryId !== toCategoryId) {
            setConfirmAction('reclassify');
            setConfirmModalOpen(true);
        }
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCategories.length > 0) {
            setConfirmAction('delete');
            setConfirmModalOpen(true);
        }
    };

    const handleConfirm = () => {
        if (confirmAction === 'reclassify' && fromCategoryId && toCategoryId) {
            onReclassify(Number(fromCategoryId), Number(toCategoryId));
            setIsReclassifyModalOpen(false);
            setFromCategoryId('');
            setToCategoryId('');
        } else if (confirmAction === 'delete') {
            onDelete(selectedCategories);
            setIsDeleteModalOpen(false);
            setSelectedCategories([]);
        }
        setConfirmModalOpen(false);
        setConfirmAction(null);
    };

    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const getFromCategoryName = () => {
        const category = categories.find(
            (cat) => cat.id === Number(fromCategoryId)
        );
        return category?.name || '';
    };

    const getToCategoryName = () => {
        const category = categories.find(
            (cat) => cat.id === Number(toCategoryId)
        );
        return category?.name || '';
    };

    const getSelectedCategoryNames = () => {
        return categories
            .filter((cat) => selectedCategories.includes(cat.id))
            .map((cat) => cat.name)
            .join(', ');
    };

    return (
        <div className='flex gap-4 mb-6'>
            {/* Reclassify Button */}
            <button
                onClick={() => setIsReclassifyModalOpen(true)}
                className='btn btn-primary'
            >
                Reclassify Transactions
            </button>

            {/* Delete Button */}
            <button
                onClick={() => setIsDeleteModalOpen(true)}
                className='btn btn-error'
            >
                Delete Transactions by Category
            </button>

            {/* Reclassify Modal */}
            <Modal
                isOpen={isReclassifyModalOpen}
                onClose={() => {
                    setIsReclassifyModalOpen(false);
                    setFromCategoryId('');
                    setToCategoryId('');
                }}
                title='Reclassify Transactions'
            >
                <form onSubmit={handleReclassifySubmit} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            From Category
                        </label>
                        <select
                            value={fromCategoryId}
                            onChange={(e) =>
                                setFromCategoryId(Number(e.target.value))
                            }
                            className='select select-bordered w-full'
                            required
                        >
                            <option value=''>
                                Select category to move from...
                            </option>
                            {availableCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            To Category
                        </label>
                        <select
                            value={toCategoryId}
                            onChange={(e) =>
                                setToCategoryId(Number(e.target.value))
                            }
                            className='select select-bordered w-full'
                            required
                        >
                            <option value=''>Select target category...</option>
                            {availableCategories
                                .filter(
                                    (cat) => cat.id !== Number(fromCategoryId)
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

                    {fromCategoryId &&
                        toCategoryId &&
                        fromCategoryId === toCategoryId && (
                            <p className='text-error/70 text-sm'>
                                Cannot reclassify to the same category
                            </p>
                        )}

                    <div className='flex justify-end gap-2 mt-6'>
                        <button
                            type='button'
                            onClick={() => {
                                setIsReclassifyModalOpen(false);
                                setFromCategoryId('');
                                setToCategoryId('');
                            }}
                            className='btn btn-neutral px-4 py-2 rounded-md transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={
                                !fromCategoryId ||
                                !toCategoryId ||
                                fromCategoryId === toCategoryId
                            }
                            className='btn btn-primary px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            Reclassify
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCategories([]);
                }}
                title='Delete Transactions by Category'
            >
                <form onSubmit={handleDeleteSubmit} className='space-y-4'>
                    <div>
                        <p className='text-sm opacity-60 mb-3'>
                            Select categories to delete all their transactions:
                        </p>
                        <div className='max-h-64 overflow-y-auto space-y-2 bg-base-200 p-3 rounded-md'>
                            {availableCategories.length === 0 ? (
                                <p className='text-sm opacity-50'>
                                    No categories available
                                </p>
                            ) : (
                                availableCategories.map((category) => (
                                    <label
                                        key={category.id}
                                        className='flex items-center gap-2 cursor-pointer hover:bg-base-300 p-2 rounded'
                                    >
                                        <input
                                            type='checkbox'
                                            checked={selectedCategories.includes(
                                                category.id
                                            )}
                                            onChange={() =>
                                                handleCategoryToggle(
                                                    category.id
                                                )
                                            }
                                            className='checkbox checkbox-primary checkbox-sm'
                                        />
                                        <span className=''>
                                            {category.name}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                        {selectedCategories.length > 0 && (
                            <p className='text-sm text-primary mt-2'>
                                {selectedCategories.length} category(ies)
                                selected
                            </p>
                        )}
                    </div>

                    <div className='flex justify-end gap-2 mt-6'>
                        <button
                            type='button'
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedCategories([]);
                            }}
                            className='btn btn-neutral px-4 py-2 rounded-md transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={selectedCategories.length === 0}
                            className='btn btn-error px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            Delete Transactions
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => {
                    setConfirmModalOpen(false);
                    setConfirmAction(null);
                }}
                onConfirm={handleConfirm}
                title={
                    confirmAction === 'reclassify'
                        ? 'Confirm Reclassification'
                        : 'Confirm Deletion'
                }
                message={
                    confirmAction === 'reclassify'
                        ? `Are you sure you want to reclassify all transactions from "${getFromCategoryName()}" to "${getToCategoryName()}"? This action cannot be undone.`
                        : `Are you sure you want to delete all transactions from the following categories: ${getSelectedCategoryNames()}? This action cannot be undone.`
                }
                confirmLabel={
                    confirmAction === 'reclassify' ? 'Reclassify' : 'Delete'
                }
                isDanger={confirmAction === 'delete'}
            />
        </div>
    );
};

export default BulkOperations;
