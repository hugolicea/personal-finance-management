import React, { useEffect, useMemo, useState } from 'react';

import BalanceOverview from '../components/BalanceOverview';
import BankStatementUpload from '../components/BankStatementUpload';
import CategoryForm from '../components/CategoryForm';
import ConfirmModal from '../components/ConfirmModal';
import EditDeleteButtons from '../components/EditDeleteButtons';
import Modal from '../components/Modal';
import SpendingChart from '../components/SpendingChart';
import TransactionForm from '../components/TransactionForm';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';
import {
    deleteTransaction,
    fetchTransactions,
} from '../store/slices/transactionsSlice';
import { Category } from '../types/categories';
import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';

function Dashboard() {
    const dispatch = useAppDispatch();
    const { categories, loading: categoriesLoading } = useAppSelector(
        (state) => state.categories
    );
    const { transactions, loading: transactionsLoading } = useAppSelector(
        (state) => state.transactions
    );

    // Modal and editing state
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    const [editingTransaction, setEditingTransaction] =
        useState<Transaction | null>(null);
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
        useState(false);
    const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
        useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null
    );
    const [deletingTransaction, setDeletingTransaction] =
        useState<Transaction | null>(null);
    // Error states
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [transactionError, setTransactionError] = useState<string | null>(
        null
    );

    // Pagination state
    const [categoryPage, setCategoryPage] = useState(1);
    const [transactionPage, setTransactionPage] = useState(1);

    // Filter states
    const [selectedYear, setSelectedYear] = React.useState(
        new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = React.useState(
        new Date().getMonth() + 1
    );
    const [filterByYear, setFilterByYear] = React.useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions());
    }, [dispatch]);

    // Memoized filtered lists
    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.date);
            const transactionYear = transactionDate.getFullYear();
            const transactionMonth = transactionDate.getMonth() + 1;
            const matchesPeriod = filterByYear
                ? transactionYear === selectedYear
                : transactionYear === selectedYear &&
                  transactionMonth === selectedMonth;
            return matchesPeriod;
        });
    }, [transactions, filterByYear, selectedYear, selectedMonth]);

    const filteredCategories = useMemo(() => {
        return categories.filter((category) =>
            filteredTransactions.some(
                (transaction) => transaction.category === category.id
            )
        );
    }, [categories, filteredTransactions]);

    // Modal handlers
    // `handleAddCategory` removed — Add Category button removed from UI
    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    };
    // `handleAddTransaction` removed — add button was removed from UI
    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowTransactionModal(true);
    };
    const handleDeleteCategory = (category: Category) => {
        setDeletingCategory(category);
        setShowDeleteCategoryDialog(true);
        setCategoryError(null);
    };
    const handleDeleteTransaction = (transaction: Transaction) => {
        setDeletingTransaction(transaction);
        setShowDeleteTransactionDialog(true);
        setTransactionError(null);
    };
    const closeModals = () => {
        setShowCategoryModal(false);
        setShowTransactionModal(false);
        setShowDeleteCategoryDialog(false);
        setShowDeleteTransactionDialog(false);
        setEditingCategory(null);
        setEditingTransaction(null);
        setDeletingCategory(null);
        setDeletingTransaction(null);
    };

    // Confirm delete handlers
    const confirmDeleteCategory = async () => {
        if (deletingCategory) {
            try {
                await dispatch(deleteCategory(deletingCategory.id)).unwrap();
                dispatch(fetchCategories());
                setShowDeleteCategoryDialog(false);
                setDeletingCategory(null);
            } catch (error) {
                setCategoryError(
                    'Failed to delete category. Please try again.'
                );
            }
        }
    };
    const confirmDeleteTransaction = async () => {
        if (deletingTransaction) {
            try {
                await dispatch(
                    deleteTransaction(deletingTransaction.id)
                ).unwrap();
                dispatch(fetchTransactions());
                setShowDeleteTransactionDialog(false);
                setDeletingTransaction(null);
            } catch (error) {
                setTransactionError(
                    'Failed to delete transaction. Please try again.'
                );
            }
        }
    };

    // Using shared EditDeleteButtons component from components/

    function CategoriesList({
        categories,
        onEdit,
        onDelete,
        page,
    }: {
        categories: Category[];
        onEdit: (c: Category) => void;
        onDelete: (c: Category) => void;
        page: number;
    }) {
        if (!categories.length)
            return (
                <p className='text-gray-500'>
                    No categories for this period. Add one!
                </p>
            );
        const ITEMS_PER_PAGE = 5;
        const start = (page - 1) * ITEMS_PER_PAGE;
        const paged = categories.slice(start, start + ITEMS_PER_PAGE);
        return (
            <>
                <ul className='divide-y divide-gray-200'>
                    {paged.map((category) => (
                        <li
                            key={category.id}
                            className='py-2 flex justify-between items-center'
                        >
                            <span className='text-sm font-medium text-gray-900'>
                                {category.name}
                            </span>
                            <EditDeleteButtons
                                onEdit={() => onEdit(category)}
                                onDelete={() => onDelete(category)}
                            />
                        </li>
                    ))}
                </ul>
                {categories.length > ITEMS_PER_PAGE && (
                    <Pagination
                        page={page}
                        total={categories.length}
                        onPageChange={setCategoryPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                )}
            </>
        );
    }

    function RecentTransactionsList({
        transactions,
        onEdit,
        onDelete,
        page,
    }: {
        transactions: Transaction[];
        onEdit: (t: Transaction) => void;
        onDelete: (t: Transaction) => void;
        page: number;
    }) {
        if (!transactions.length)
            return (
                <p className='text-gray-500'>
                    No recent transactions. Add one!
                </p>
            );
        const ITEMS_PER_PAGE = 5;
        const start = (page - 1) * ITEMS_PER_PAGE;
        const paged = transactions.slice(start, start + ITEMS_PER_PAGE);
        return (
            <>
                <ul className='divide-y divide-gray-200'>
                    {paged.map((transaction) => (
                        <li key={transaction.id} className='py-2'>
                            <div className='flex justify-between items-start'>
                                <div className='flex-1'>
                                    <div className='flex justify-between'>
                                        <span className='text-sm font-medium text-gray-900'>
                                            {transaction.description}
                                        </span>
                                        <span
                                            className={`text-sm font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                                        >
                                            {formatCurrency(
                                                Math.abs(transaction.amount)
                                            )}
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-500'>
                                        {new Date(
                                            transaction.date
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <EditDeleteButtons
                                    onEdit={() => onEdit(transaction)}
                                    onDelete={() => onDelete(transaction)}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
                {transactions.length > ITEMS_PER_PAGE && (
                    <Pagination
                        page={page}
                        total={transactions.length}
                        onPageChange={setTransactionPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                )}
            </>
        );
    }
    // Pagination component
    function Pagination({
        page,
        total,
        onPageChange,
        itemsPerPage,
    }: {
        page: number;
        total: number;
        onPageChange: (p: number) => void;
        itemsPerPage: number;
    }) {
        const totalPages = Math.ceil(total / itemsPerPage);
        if (totalPages <= 1) return null;
        return (
            <nav className='flex justify-center mt-2' aria-label='Pagination'>
                <button
                    className='px-2 py-1 mx-1 rounded border text-xs bg-gray-100 hover:bg-gray-200'
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    aria-label='Previous page'
                >
                    &lt;
                </button>
                <span className='px-2 py-1 text-xs'>
                    Page {page} of {totalPages}
                </span>
                <button
                    className='px-2 py-1 mx-1 rounded border text-xs bg-gray-100 hover:bg-gray-200'
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    aria-label='Next page'
                >
                    &gt;
                </button>
            </nav>
        );
    }

    function DashboardFilters() {
        return (
            <div className='flex flex-wrap items-center gap-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Year
                    </label>
                    <select
                        value={selectedYear}
                        onChange={(e) =>
                            setSelectedYear(parseInt(e.target.value))
                        }
                        className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    >
                        {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Month
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(parseInt(e.target.value))
                        }
                        disabled={filterByYear}
                        className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                    >
                        {[
                            'January',
                            'February',
                            'March',
                            'April',
                            'May',
                            'June',
                            'July',
                            'August',
                            'September',
                            'October',
                            'November',
                            'December',
                        ].map((m, i) => (
                            <option key={i + 1} value={i + 1}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Filter
                    </label>
                    <div className='flex items-center space-x-2'>
                        <button
                            onClick={() => setFilterByYear(false)}
                            className={`px-3 py-2 text-sm rounded-md border ${!filterByYear ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setFilterByYear(true)}
                            className={`px-3 py-2 text-sm rounded-md border ${filterByYear ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            Year
                        </button>
                    </div>
                </div>
                <div className='text-sm text-gray-500 self-end'>
                    {filteredTransactions.length} transaction
                    {filteredTransactions.length !== 1 ? 's' : ''} for{' '}
                    {filterByYear
                        ? selectedYear
                        : `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-100'>
            <header className='bg-white shadow'>
                <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
                    <h1 className='text-3xl font-bold text-gray-900'>
                        Personal Finance Managment Dashboard
                    </h1>
                </div>
            </header>

            {/* Filters */}
            <div className='bg-white shadow-sm border-b'>
                <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
                    <DashboardFilters />
                </div>
            </div>

            <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                <div className='px-4 py-6 sm:px-0'>
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        {/* Balance Overview */}
                        <div className='lg:col-span-3'>
                            <BalanceOverview
                                transactions={filteredTransactions}
                            />
                        </div>

                        {/* Categories Section */}
                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex-shrink-0'>
                                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                                            Categories
                                        </h3>
                                    </div>
                                    {/* Add Category button removed per request */}
                                </div>
                                <div className='mt-5'>
                                    {categoryError && (
                                        <div className='text-red-600 text-xs mb-2'>
                                            {categoryError}
                                        </div>
                                    )}
                                    {categoriesLoading ? (
                                        <div className='flex flex-col gap-2'>
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className='animate-pulse h-6 bg-gray-200 rounded w-full'
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <CategoriesList
                                            categories={filteredCategories}
                                            onEdit={handleEditCategory}
                                            onDelete={handleDeleteCategory}
                                            page={categoryPage}
                                        />
                                    )}
                                    {filteredCategories.length > 5 && (
                                        <button className='text-blue-600 hover:underline text-xs mt-2'>
                                            View All Categories
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex-shrink-0'>
                                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                                            Recent Transactions
                                        </h3>
                                    </div>
                                    {/* Add Transaction button removed per request */}
                                </div>
                                <div className='mt-5'>
                                    {transactionError && (
                                        <div className='text-red-600 text-xs mb-2'>
                                            {transactionError}
                                        </div>
                                    )}
                                    {transactionsLoading ? (
                                        <div className='flex flex-col gap-2'>
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className='animate-pulse h-6 bg-gray-200 rounded w-full'
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <RecentTransactionsList
                                            transactions={filteredTransactions}
                                            onEdit={handleEditTransaction}
                                            onDelete={handleDeleteTransaction}
                                            page={transactionPage}
                                        />
                                    )}
                                    {filteredTransactions.length > 5 && (
                                        <button className='text-blue-600 hover:underline text-xs mt-2'>
                                            View All Transactions
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Spending Chart */}
                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-5'>
                                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                    Spending by Category
                                </h3>
                                <SpendingChart
                                    transactions={filteredTransactions}
                                    categories={filteredCategories}
                                />
                            </div>
                        </div>

                        {/* Bank Statement Upload Section */}
                        <div className='lg:col-span-3'>
                            <BankStatementUpload />
                        </div>
                    </div>
                </div>
            </main>

            {/* Category Modal */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory ?? undefined}
                    onClose={closeModals}
                />
            </Modal>

            {/* Transaction Modal */}
            <Modal isOpen={showTransactionModal} onClose={closeModals}>
                <TransactionForm
                    transaction={editingTransaction ?? undefined}
                    onClose={closeModals}
                />
            </Modal>

            {/* Delete Confirmation Modals */}
            <ConfirmModal
                isOpen={showDeleteCategoryDialog}
                onClose={() => setShowDeleteCategoryDialog(false)}
                onConfirm={confirmDeleteCategory}
                title='Delete Category'
                message={
                    <>
                        Are you sure you want to delete the category "
                        <strong>{deletingCategory?.name}</strong>"? This action
                        cannot be undone.
                    </>
                }
                confirmLabel='Delete'
                cancelLabel='Cancel'
                isDanger
            />

            <ConfirmModal
                isOpen={showDeleteTransactionDialog}
                onClose={() => setShowDeleteTransactionDialog(false)}
                onConfirm={confirmDeleteTransaction}
                title='Delete Transaction'
                message={
                    <>
                        Are you sure you want to delete the transaction "
                        <strong>{deletingTransaction?.description}</strong>"?
                        This action cannot be undone.
                    </>
                }
                confirmLabel='Delete'
                cancelLabel='Cancel'
                isDanger
            />
        </div>
    );
}

export default Dashboard;
