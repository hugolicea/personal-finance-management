import { useCallback, useEffect, useMemo, useState } from 'react';

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
};

function CategoryPanel({
    title,
    count,
    colorScheme,
    table,
}: CategoryPanelProps) {
    const [searchValue, setSearchValue] = useState('');
    const isRed = colorScheme === 'red';
    const headerCls = isRed
        ? 'bg-error/10 border-b border-error/30 text-error'
        : 'bg-success/10 border-b border-success/30 text-success';
    const ringCls = isRed ? 'focus:ring-red-500' : 'focus:ring-green-500';
    const searchPlaceholder = isRed
        ? 'Search spending categories...'
        : 'Search income categories...';

    return (
        <div className='card bg-base-100 shadow-sm overflow-hidden'>
            <div className={`px-6 py-4 ${headerCls}`}>
                <h3 className='text-lg font-medium'>
                    {title} ({count})
                </h3>
            </div>
            <div className='px-6 py-4 border-b border-base-300'>
                <input
                    type='text'
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                        table.setGlobalFilter(e.target.value);
                    }}
                    className={`w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 ${ringCls}`}
                />
            </div>
            <div className='overflow-x-auto'>
                <table className='table table-zebra w-full'>
                    <thead className='sticky top-0 bg-base-100 z-10 shadow-sm'>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((h) => (
                                    <th
                                        key={h.id}
                                        className='px-4 py-2 text-left text-xs font-medium text-base-content/70 uppercase'
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
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className=''>
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
}

function Categories() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
        useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null
    );
    const [deleteError, setDeleteError] = useState<string | null>(null);

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
                    <div className='text-sm font-medium'>
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
                        <div className='text-sm font-semibold text-primary tabular-nums'>
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

    const spendTable = useReactTable({
        data: spendCategories,
        columns: spendColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    });

    const incomeTable = useReactTable({
        data: incomeCategories,
        columns: incomeColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    });

    return (
        <div className='space-y-6'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold mb-8'>Categories</h1>

                <div className='flex justify-end mb-4'>
                    <button
                        onClick={handleAddCategory}
                        className='btn btn-primary'
                    >
                        Add Category
                    </button>
                </div>

                <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    <CategoryPanel
                        title='💸 Spending Categories'
                        count={spendCategories.length}
                        colorScheme='red'
                        table={spendTable}
                    />
                    <CategoryPanel
                        title='💰 Income Categories'
                        count={incomeCategories.length}
                        colorScheme='green'
                        table={incomeTable}
                    />
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
                            <p className='mt-2 text-error font-medium'>
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
