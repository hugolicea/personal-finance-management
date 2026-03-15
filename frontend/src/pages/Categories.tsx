import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
    ColumnDef,
    Table,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import CategoryForm from '../components/CategoryForm';
import ConfirmModal from '../components/ConfirmModal';
import EditDeleteIconButtons from '../components/EditDeleteIconButtons';
import Modal from '../components/Modal';
import Paginator from '../components/Paginator';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';
import { Category } from '../types/categories';
import { formatCurrency } from '../utils/formatters';

type CategoryPanelProps = {
    title: string;
    count: number;
    colorScheme: 'red' | 'green';
    table: Table<Category>;
    searchValue: string;
    onSearchChange: (value: string) => void;
};

const CategoryPanel = memo(function CategoryPanel({
    title,
    count,
    colorScheme,
    table,
    searchValue,
    onSearchChange,
}: CategoryPanelProps) {
    const isRed = colorScheme === 'red';
    const headerCls = isRed
        ? 'bg-red-50 border-b border-red-200 text-red-900'
        : 'bg-green-50 border-b border-green-200 text-green-900';
    const ringCls = isRed ? 'focus:ring-red-500' : 'focus:ring-green-500';
    const searchPlaceholder = isRed
        ? 'Search spending categories...'
        : 'Search income categories...';

    return (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
            <div className={`px-6 py-4 ${headerCls}`}>
                <h3 className='text-lg font-medium'>
                    {title} ({count})
                </h3>
            </div>
            <div className='px-6 py-4 border-b border-gray-200'>
                <input
                    type='text'
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${ringCls}`}
                />
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full table-auto divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((h) => (
                                    <th
                                        key={h.id}
                                        className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                    >
                                        {h.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  h.column.columnDef.header,
                                                  h.getContext()
                                              )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className='hover:bg-gray-50'>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className='px-4 py-2 whitespace-nowrap'
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Paginator table={table} />
        </div>
    );
});

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
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const confirmDeleteCategory = useCallback(async () => {
        if (!deletingCategory) return;
        setDeleteError(null);
        try {
            await dispatch(deleteCategory(deletingCategory.id)).unwrap();
            setShowDeleteCategoryDialog(false);
            setDeletingCategory(null);
        } catch (error) {
            console.error('Failed to delete category:', error);
            setDeleteError('Failed to delete category. Please try again.');
        }
    }, [deletingCategory, dispatch]);

    const closeModals = useCallback(() => {
        setShowCategoryModal(false);
        setShowDeleteCategoryDialog(false);
        setEditingCategory(null);
        setDeletingCategory(null);
        setDeleteError(null);
    }, []);

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
                        <EditDeleteIconButtons
                            onEdit={() => handleEditCategory(row.original)}
                            onDelete={() => handleDeleteCategory(row.original)}
                        />
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
        pageSize: 5,
    });

    const [incomePagination, setIncomePagination] = useState({
        pageIndex: 0,
        pageSize: 5,
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
    });

    return (
        <div className='pb-6'>
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
                            Add Category
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
                                                        <EditDeleteIconButtons
                                                            onEdit={() =>
                                                                handleEditCategory(
                                                                    category
                                                                )
                                                            }
                                                            onDelete={() =>
                                                                handleDeleteCategory(
                                                                    category
                                                                )
                                                            }
                                                        />
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
                                                    <EditDeleteIconButtons
                                                        onEdit={() =>
                                                            handleEditCategory(
                                                                category
                                                            )
                                                        }
                                                        onDelete={() =>
                                                            handleDeleteCategory(
                                                                category
                                                            )
                                                        }
                                                    />
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
                            <CategoryPanel
                                title='💸 Spending Categories'
                                count={spendCategories.length}
                                colorScheme='red'
                                table={spendTable}
                                searchValue={spendGlobalFilter}
                                onSearchChange={setSpendGlobalFilter}
                            />
                            <CategoryPanel
                                title='💰 Income Categories'
                                count={incomeCategories.length}
                                colorScheme='green'
                                table={incomeTable}
                                searchValue={incomeGlobalFilter}
                                onSearchChange={setIncomeGlobalFilter}
                            />
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
            <ConfirmModal
                isOpen={showDeleteCategoryDialog}
                onClose={closeModals}
                onConfirm={confirmDeleteCategory}
                title='Delete Category'
                message={
                    <>
                        Are you sure you want to delete the category "
                        <strong>{deletingCategory?.name}</strong>"? This action
                        cannot be undone and will affect all associated
                        transactions.
                        {deleteError && (
                            <p className='mt-2 text-red-600 font-medium'>
                                {deleteError}
                            </p>
                        )}
                    </>
                }
                confirmLabel='Delete'
                cancelLabel='Cancel'
                isDanger
            />
        </div>
    );
}

export default Categories;
