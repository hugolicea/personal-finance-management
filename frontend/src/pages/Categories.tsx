import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import Paginator from '../components/Paginator';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';
import { Category } from '../types/categories';
import { formatCurrency } from '../utils/formatters';

function Categories() {
    const dispatch = useAppDispatch();
    const { categories, loading } = useAppSelector((state) => state.categories);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
        useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null
    );
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

    const [spendGlobalFilter, setSpendGlobalFilter] = useState('');
    const [incomeGlobalFilter, setIncomeGlobalFilter] = useState('');

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleAddCategory = useCallback(() => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    }, []);

    const handleEditCategory = useCallback((category: Category) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    }, []);

    const handleDeleteCategory = useCallback((category: Category) => {
        setDeletingCategory(category);
        setShowDeleteCategoryDialog(true);
    }, []);

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

    // Separate categories for card view
    const spendCategories = useMemo(
        () =>
            categories
                .filter((category) => category.classification === 'spend')
                .sort((a, b) => a.name.localeCompare(b.name)),
        [categories]
    );

    const incomeCategories = useMemo(
        () =>
            categories
                .filter((category) => category.classification === 'income')
                .sort((a, b) => a.name.localeCompare(b.name)),
        [categories]
    );

    // Per-table columns are defined in `spendColumns` / `incomeColumns` below

    // Per-table column sets: omit classification since each table is already scoped
    const spendColumns = useMemo<ColumnDef<Category>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Category Name',
                cell: ({ getValue }) => (
                    <div className='text-sm font-medium text-gray-900'>
                        {getValue<string>()}
                    </div>
                ),
            },
            {
                accessorKey: 'monthly_budget',
                header: 'Monthly Budget',
                cell: ({ getValue }) => {
                    const value = getValue<number | string>();
                    const numericValue =
                        typeof value === 'string' ? parseFloat(value) : value;
                    return (
                        <div className='text-sm font-semibold text-blue-600'>
                            {formatCurrency(numericValue || 0)}
                        </div>
                    );
                },
                sortingFn: (rowA, rowB, columnId) => {
                    const a = rowA.getValue(columnId) as number | string;
                    const b = rowB.getValue(columnId) as number | string;
                    const aNum = typeof a === 'string' ? parseFloat(a) : a;
                    const bNum = typeof b === 'string' ? parseFloat(b) : b;
                    return aNum - bNum;
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className='relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
                        <button
                            onClick={() => handleEditCategory(row.original)}
                            className='inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 mr-2'
                        >
                            <svg
                                className='w-4 h-4 mr-1.5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeleteCategory(row.original)}
                            className='inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200'
                        >
                            <svg
                                className='w-4 h-4 mr-1.5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                            </svg>
                            Delete
                        </button>
                    </div>
                ),
            },
        ],
        [handleEditCategory, handleDeleteCategory]
    );

    const incomeColumns = spendColumns; // identical columns for income table

    // Combined table instance removed — using per-table instances below

    // Per-table pagination state
    const [spendPagination, setSpendPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [incomePagination, setIncomePagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const spendTable = useReactTable({
        data: spendCategories,
        columns: spendColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: setSpendPagination,
        onGlobalFilterChange: setSpendGlobalFilter,
        state: { pagination: spendPagination, globalFilter: spendGlobalFilter },
        initialState: { pagination: { pageSize: 5 } },
    });

    const incomeTable = useReactTable({
        data: incomeCategories,
        columns: incomeColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: setIncomePagination,
        onGlobalFilterChange: setIncomeGlobalFilter,
        state: {
            pagination: incomePagination,
            globalFilter: incomeGlobalFilter,
        },
        initialState: { pagination: { pageSize: 5 } },
    });

    // Memoized values for performance (after table creation)
    // (removed unused filteredRows/currentColumnFilters)

    return (
        <div className='pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-gray-900 mb-8'>
                        Categories
                    </h1>

                    {/* Add Category Button */}
                    <div className='flex justify-between items-center mb-4'>
                        <div className='flex items-center space-x-2'>
                            <span className='text-sm text-gray-700'>View:</span>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`px-3 py-1 text-sm rounded-md ${
                                    viewMode === 'card'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Cards
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-sm rounded-md ${
                                    viewMode === 'table'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Table
                            </button>
                        </div>

                        <button
                            onClick={handleAddCategory}
                            className='bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 border-2 border-green-800'
                        >
                            ➕ Add Category
                        </button>
                    </div>

                    {/* Global Search and Filters - Only show in table view */}

                    {/* Categories Display */}
                    {viewMode === 'card' ? (
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
                                                            {formatCurrency(
                                                                category.monthly_budget ??
                                                                    0
                                                            )}
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
                                                            {formatCurrency(
                                                                category.monthly_budget ??
                                                                    0
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                                <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
                                    <h3 className='text-lg font-medium text-red-900'>
                                        💸 Spending Categories (
                                        {spendCategories.length})
                                    </h3>
                                </div>
                                <div className='px-6 py-4 border-b border-gray-200'>
                                    <div className='flex gap-4'>
                                        <div className='flex-1'>
                                            <input
                                                type='text'
                                                placeholder='Search spending categories...'
                                                value={spendGlobalFilter ?? ''}
                                                onChange={(event) =>
                                                    setSpendGlobalFilter(
                                                        event.target.value
                                                    )
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='overflow-x-auto'>
                                    <table className='w-full table-auto divide-y divide-gray-200'>
                                        <thead className='bg-gray-50'>
                                            {spendTable
                                                .getHeaderGroups()
                                                .map((headerGroup) => (
                                                    <tr key={headerGroup.id}>
                                                        {headerGroup.headers.map(
                                                            (header) => (
                                                                <th
                                                                    key={
                                                                        header.id
                                                                    }
                                                                    className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                                                >
                                                                    {header.isPlaceholder
                                                                        ? null
                                                                        : flexRender(
                                                                              header
                                                                                  .column
                                                                                  .columnDef
                                                                                  .header,
                                                                              header.getContext()
                                                                          )}
                                                                </th>
                                                            )
                                                        )}
                                                    </tr>
                                                ))}
                                        </thead>
                                        <tbody className='bg-white divide-y divide-gray-200'>
                                            {spendTable
                                                .getRowModel()
                                                .rows.map((row) => (
                                                    <tr
                                                        key={row.id}
                                                        className='hover:bg-gray-50'
                                                    >
                                                        {row
                                                            .getVisibleCells()
                                                            .map((cell) => (
                                                                <td
                                                                    key={
                                                                        cell.id
                                                                    }
                                                                    className='px-4 py-2 whitespace-nowrap'
                                                                >
                                                                    {flexRender(
                                                                        cell
                                                                            .column
                                                                            .columnDef
                                                                            .cell,
                                                                        cell.getContext()
                                                                    )}
                                                                </td>
                                                            ))}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Paginator table={spendTable} />
                            </div>

                            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                                <div className='px-6 py-4 bg-green-50 border-b border-green-200'>
                                    <h3 className='text-lg font-medium text-green-900'>
                                        💰 Income Categories (
                                        {incomeCategories.length})
                                    </h3>
                                </div>
                                <div className='px-6 py-4 border-b border-gray-200'>
                                    <div className='flex gap-4'>
                                        <div className='flex-1'>
                                            <input
                                                type='text'
                                                placeholder='Search income categories...'
                                                value={incomeGlobalFilter ?? ''}
                                                onChange={(event) =>
                                                    setIncomeGlobalFilter(
                                                        event.target.value
                                                    )
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='overflow-x-auto'>
                                    <table className='w-full table-auto divide-y divide-gray-200'>
                                        <thead className='bg-gray-50'>
                                            {incomeTable
                                                .getHeaderGroups()
                                                .map((headerGroup) => (
                                                    <tr key={headerGroup.id}>
                                                        {headerGroup.headers.map(
                                                            (header) => (
                                                                <th
                                                                    key={
                                                                        header.id
                                                                    }
                                                                    className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                                                >
                                                                    {header.isPlaceholder
                                                                        ? null
                                                                        : flexRender(
                                                                              header
                                                                                  .column
                                                                                  .columnDef
                                                                                  .header,
                                                                              header.getContext()
                                                                          )}
                                                                </th>
                                                            )
                                                        )}
                                                    </tr>
                                                ))}
                                        </thead>
                                        <tbody className='bg-white divide-y divide-gray-200'>
                                            {incomeTable
                                                .getRowModel()
                                                .rows.map((row) => (
                                                    <tr
                                                        key={row.id}
                                                        className='hover:bg-gray-50'
                                                    >
                                                        {row
                                                            .getVisibleCells()
                                                            .map((cell) => (
                                                                <td
                                                                    key={
                                                                        cell.id
                                                                    }
                                                                    className='px-4 py-2 whitespace-nowrap'
                                                                >
                                                                    {flexRender(
                                                                        cell
                                                                            .column
                                                                            .columnDef
                                                                            .cell,
                                                                        cell.getContext()
                                                                    )}
                                                                </td>
                                                            ))}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Paginator table={incomeTable} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Modal */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory ?? undefined}
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
