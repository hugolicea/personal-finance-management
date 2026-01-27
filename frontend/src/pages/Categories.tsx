import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';
import { formatCurrency } from '../utils/formatters';

interface Category {
    id: number;
    name: string;
    classification: string;
    monthly_budget: number;
}

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
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

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

    // Prepare table data
    const tableData = useMemo(() => {
        const spendCategories = categories
            .filter((category) => category.classification === 'spend')
            .sort((a, b) => a.name.localeCompare(b.name));
        const incomeCategories = categories
            .filter((category) => category.classification === 'income')
            .sort((a, b) => a.name.localeCompare(b.name));

        return [...spendCategories, ...incomeCategories];
    }, [categories]);

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

    // Define table columns
    const columns = useMemo<ColumnDef<Category>[]>(
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
                accessorKey: 'classification',
                header: 'Type',
                cell: ({ getValue }) => {
                    const classification = getValue<string>();
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                classification === 'spend'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {classification === 'spend'
                                ? '💸 Spend'
                                : '💰 Income'}
                        </span>
                    );
                },
                filterFn: 'equals',
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
                    <div className='flex space-x-2'>
                        <button
                            onClick={() => handleEditCategory(row.original)}
                            className='text-blue-600 hover:text-blue-800 text-sm'
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeleteCategory(row.original)}
                            className='text-red-600 hover:text-red-800 text-sm'
                        >
                            Delete
                        </button>
                    </div>
                ),
            },
        ],
        [handleEditCategory, handleDeleteCategory]
    );

    // Create table instance
    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    // Memoized values for performance (after table creation)
    const filteredRows = table.getFilteredRowModel().rows;
    const currentColumnFilters = table.getState().columnFilters;

    const filteredRowCount = useMemo(
        () => filteredRows.length,
        [filteredRows.length]
    );

    const currentClassificationFilter = useMemo(
        () =>
            currentColumnFilters.find((f) => f.id === 'classification')
                ?.value || '',
        [currentColumnFilters]
    );

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
                    {viewMode === 'table' && (
                        <div className='mb-4 flex flex-col sm:flex-row gap-4'>
                            <div className='flex-1'>
                                <input
                                    type='text'
                                    placeholder='Search categories...'
                                    value={globalFilter}
                                    onChange={(e) =>
                                        setGlobalFilter(e.target.value)
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <div className='flex gap-2'>
                                <select
                                    value={currentClassificationFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value) {
                                            table
                                                .getColumn('classification')
                                                ?.setFilterValue(value);
                                        } else {
                                            table
                                                .getColumn('classification')
                                                ?.setFilterValue(undefined);
                                        }
                                    }}
                                    className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                >
                                    <option value=''>All Types</option>
                                    <option value='spend'>💸 Spend</option>
                                    <option value='income'>💰 Income</option>
                                </select>
                            </div>
                        </div>
                    )}

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
                                                                category.monthly_budget
                                                                    ? parseFloat(
                                                                          category.monthly_budget
                                                                      )
                                                                    : 0
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
                                                                category.monthly_budget
                                                                    ? parseFloat(
                                                                          category.monthly_budget
                                                                      )
                                                                    : 0
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
                        /* Advanced Table View with TanStack Table */
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
                                <h3 className='text-lg font-medium text-gray-900'>
                                    📊 All Categories ({filteredRowCount})
                                </h3>
                            </div>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200'>
                                    <thead className='bg-gray-50'>
                                        {table
                                            .getHeaderGroups()
                                            .map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map(
                                                        (header) => (
                                                            <th
                                                                key={header.id}
                                                                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                                                                onClick={header.column.getToggleSortingHandler()}
                                                            >
                                                                <div className='flex items-center space-x-1'>
                                                                    <span>
                                                                        {header.isPlaceholder
                                                                            ? null
                                                                            : flexRender(
                                                                                  header
                                                                                      .column
                                                                                      .columnDef
                                                                                      .header,
                                                                                  header.getContext()
                                                                              )}
                                                                    </span>
                                                                    {{
                                                                        asc: ' 🔼',
                                                                        desc: ' 🔽',
                                                                    }[
                                                                        header.column.getIsSorted() as string
                                                                    ] ?? null}
                                                                </div>
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                        {table.getRowModel().rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className='hover:bg-gray-50'
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => (
                                                        <td
                                                            key={cell.id}
                                                            className='px-6 py-4 whitespace-nowrap'
                                                        >
                                                            {flexRender(
                                                                cell.column
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

                            {/* Pagination */}
                            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                    <span className='text-sm text-gray-700'>
                                        Show
                                    </span>
                                    <select
                                        value={
                                            table.getState().pagination.pageSize
                                        }
                                        onChange={(e) => {
                                            table.setPageSize(
                                                Number(e.target.value)
                                            );
                                        }}
                                        className='px-2 py-1 border border-gray-300 rounded text-sm'
                                    >
                                        {[10, 20, 30, 40, 50].map(
                                            (pageSize) => (
                                                <option
                                                    key={pageSize}
                                                    value={pageSize}
                                                >
                                                    {pageSize}
                                                </option>
                                            )
                                        )}
                                    </select>
                                    <span className='text-sm text-gray-700'>
                                        entries
                                    </span>
                                </div>

                                <div className='flex items-center space-x-2'>
                                    <span className='text-sm text-gray-700'>
                                        Page{' '}
                                        {table.getState().pagination.pageIndex +
                                            1}{' '}
                                        of {table.getPageCount()}
                                    </span>
                                    <div className='flex space-x-1'>
                                        <button
                                            onClick={() =>
                                                table.setPageIndex(0)
                                            }
                                            disabled={
                                                !table.getCanPreviousPage()
                                            }
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'<<'}
                                        </button>
                                        <button
                                            onClick={() => table.previousPage()}
                                            disabled={
                                                !table.getCanPreviousPage()
                                            }
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'<'}
                                        </button>
                                        <button
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'>'}
                                        </button>
                                        <button
                                            onClick={() =>
                                                table.setPageIndex(
                                                    table.getPageCount() - 1
                                                )
                                            }
                                            disabled={!table.getCanNextPage()}
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'>>'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {loading && (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading categories...
                                </div>
                            )}
                            {!loading && filteredRowCount === 0 && (
                                <div className='p-6 text-center text-gray-500'>
                                    No categories found
                                </div>
                            )}
                        </div>
                    )}
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
