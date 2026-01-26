import { useEffect, useState } from 'react';

import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';

function Categories() {
    const dispatch = useAppDispatch();
    const { categories, loading } = useAppSelector((state) => state.categories);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
        useState(false);
    const [deletingCategory, setDeletingCategory] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category: any) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleDeleteCategory = (category: any) => {
        setDeletingCategory(category);
        setShowDeleteCategoryDialog(true);
    };

    const confirmDeleteCategory = async () => {
        if (deletingCategory) {
            try {
                await dispatch(deleteCategory(deletingCategory.id)).unwrap();
                dispatch(fetchCategories());
                setShowDeleteCategoryDialog(false);
                setDeletingCategory(null);
            } catch (error) {
                console.error('Failed to delete category:', error);
                alert('Failed to delete category. Please try again.');
            }
        }
    };

    const closeModals = () => {
        setShowCategoryModal(false);
        setShowDeleteCategoryDialog(false);
        setEditingCategory(null);
        setDeletingCategory(null);
    };

    // Separate categories into spends and incomes
    const spendCategories = categories
        .filter((category) => category.classification === 'spend')
        .sort((a, b) => a.name.localeCompare(b.name));
    const incomeCategories = categories
        .filter((category) => category.classification === 'income')
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className='pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-gray-900 mb-8'>
                        Categories
                    </h1>

                    {/* Add Category Button */}
                    <div className='flex justify-end mb-4'>
                        <button
                            onClick={handleAddCategory}
                            className='bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 border-2 border-green-800'
                        >
                            ➕ Add Category
                        </button>
                    </div>

                    {/* Categories Panels */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Spends Panel */}
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
                                <h3 className='text-lg font-medium text-red-900'>
                                    💸 Spending Categories
                                </h3>
                            </div>
                            {loading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading categories...
                                </div>
                            ) : spendCategories.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No spending categories found
                                </div>
                            ) : (
                                <div className='divide-y divide-gray-200'>
                                    {spendCategories.map((category) => (
                                        <div
                                            key={`spend-${category.id}`}
                                            className='p-6'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center space-x-4'>
                                                    <h3 className='text-lg font-medium text-gray-900'>
                                                        {category.name}
                                                    </h3>
                                                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                                                        💸 Spend
                                                    </span>
                                                </div>
                                                <div className='flex space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            handleEditCategory(
                                                                category
                                                            )
                                                        }
                                                        className='text-blue-600 hover:text-blue-800 text-sm'
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteCategory(
                                                                category
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-800 text-sm'
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Category Details */}
                                            <div className='mt-4 pt-4 border-t border-gray-200'>
                                                <div className='flex justify-between items-center'>
                                                    <span className='text-sm text-gray-500'>
                                                        Monthly Budget
                                                    </span>
                                                    <span className='text-lg font-semibold text-blue-600'>
                                                        $
                                                        {category.monthly_budget
                                                            ? parseFloat(
                                                                  category.monthly_budget
                                                              ).toFixed(2)
                                                            : '0.00'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Incomes Panel */}
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-green-50 border-b border-green-200'>
                                <h3 className='text-lg font-medium text-green-900'>
                                    💰 Income Categories
                                </h3>
                            </div>
                            {loading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading categories...
                                </div>
                            ) : incomeCategories.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No income categories found
                                </div>
                            ) : (
                                <div className='divide-y divide-gray-200'>
                                    {incomeCategories.map((category) => (
                                        <div
                                            key={`income-${category.id}`}
                                            className='p-6'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center space-x-4'>
                                                    <h3 className='text-lg font-medium text-gray-900'>
                                                        {category.name}
                                                    </h3>
                                                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                                        💰 Income
                                                    </span>
                                                </div>
                                                <div className='flex space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            handleEditCategory(
                                                                category
                                                            )
                                                        }
                                                        className='text-blue-600 hover:text-blue-800 text-sm'
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteCategory(
                                                                category
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-800 text-sm'
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Category Details */}
                                            <div className='mt-4 pt-4 border-t border-gray-200'>
                                                <div className='flex justify-between items-center'>
                                                    <span className='text-sm text-gray-500'>
                                                        Monthly Budget
                                                    </span>
                                                    <span className='text-lg font-semibold text-blue-600'>
                                                        $
                                                        {category.monthly_budget
                                                            ? parseFloat(
                                                                  category.monthly_budget
                                                              ).toFixed(2)
                                                            : '0.00'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory}
                    onClose={closeModals}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteCategoryDialog}
                onClose={() => setShowDeleteCategoryDialog(false)}
            >
                <div className='p-6'>
                    <h3 className='text-lg font-medium text-gray-900 mb-4'>
                        Delete Category
                    </h3>
                    <p className='text-sm text-gray-500 mb-4'>
                        Are you sure you want to delete the category "
                        {deletingCategory?.name}"? This action cannot be undone
                        and will affect all associated transactions.
                    </p>
                    <div className='flex justify-end space-x-3'>
                        <button
                            onClick={() => setShowDeleteCategoryDialog(false)}
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteCategory}
                            className='px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700'
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Categories;
