import { useEffect, useState } from 'react';

import BankStatementUpload from '../components/BankStatementUpload';
import CategoryForm from '../components/CategoryForm';
import CategorySelect from '../components/CategorySelect';
import ConfirmModal from '../components/ConfirmModal';
import EditDeleteIconButtons from '../components/EditDeleteIconButtons';
import Modal from '../components/Modal';
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

function AccountTransactions() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const {
        transactions,
        loading: transactionsLoading,
        deleting,
    } = useAppSelector((state) => state.transactions);

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

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based
    const [filterByYear, setFilterByYear] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
        []
    );
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Fetch transactions when filters change
    useEffect(() => {
        const dateAfter = filterByYear
            ? `${selectedYear}-01-01`
            : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

        const dateBeforeYear = filterByYear ? selectedYear : selectedYear;
        const dateBeforeMonth = filterByYear ? 12 : selectedMonth;
        const lastDay = new Date(dateBeforeYear, dateBeforeMonth, 0).getDate();
        const dateBefore = `${dateBeforeYear}-${String(
            dateBeforeMonth
        ).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        dispatch(
            fetchTransactions({
                transaction_type: 'account',
                category: selectedCategory || undefined,
                search: searchTerm || undefined,
                date_after: dateAfter,
                date_before: dateBefore,
                ordering: '-date',
            })
        );
    }, [
        dispatch,
        filterByYear,
        selectedYear,
        selectedMonth,
        selectedCategory,
        searchTerm,
    ]);

    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setShowTransactionModal(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowTransactionModal(true);
    };

    const handleDeleteTransaction = (transaction: Transaction) => {
        setDeletingTransaction(transaction);
        setShowDeleteTransactionDialog(true);
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

    const confirmDeleteTransaction = async () => {
        if (deletingTransaction) {
            try {
                await dispatch(
                    deleteTransaction(deletingTransaction.id)
                ).unwrap();
                // Re-fetch with current filters
                const dateAfter = filterByYear
                    ? `${selectedYear}-01-01`
                    : `${selectedYear}-${String(selectedMonth).padStart(
                          2,
                          '0'
                      )}-01`;
                const dateBeforeYear = filterByYear
                    ? selectedYear
                    : selectedYear;
                const dateBeforeMonth = filterByYear ? 12 : selectedMonth;
                const lastDay = new Date(
                    dateBeforeYear,
                    dateBeforeMonth,
                    0
                ).getDate();
                const dateBefore = `${dateBeforeYear}-${String(
                    dateBeforeMonth
                ).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                dispatch(
                    fetchTransactions({
                        transaction_type: 'account',
                        category: selectedCategory || undefined,
                        search: searchTerm || undefined,
                        date_after: dateAfter,
                        date_before: dateBefore,
                        ordering: '-date',
                    })
                );
                setShowDeleteTransactionDialog(false);
                setDeletingTransaction(null);
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                alert('Failed to delete transaction. Please try again.');
            }
        }
    };

    const handleSelectTransaction = (
        transactionId: number,
        checked: boolean
    ) => {
        if (checked) {
            setSelectedTransactions((prev) => [...prev, transactionId]);
        } else {
            setSelectedTransactions((prev) =>
                prev.filter((id) => id !== transactionId)
            );
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTransactions(filteredTransactions.map((t) => t.id));
        } else {
            setSelectedTransactions([]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedTransactions.length === 0) return;
        setShowBulkDeleteDialog(true);
    };

    const confirmBulkDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete transactions one by one
            const deletePromises = selectedTransactions.map((id) =>
                dispatch(deleteTransaction(id)).unwrap()
            );

            await Promise.all(deletePromises);
            dispatch(fetchTransactions());
            setSelectedTransactions([]);
            setShowBulkDeleteDialog(false);
        } catch (error) {
            console.error('Failed to delete transactions:', error);
            alert('Failed to delete some transactions. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModals = () => {
        setShowCategoryModal(false);
        setShowTransactionModal(false);
        setShowDeleteCategoryDialog(false);
        setShowDeleteTransactionDialog(false);
        setShowBulkDeleteDialog(false);
        setEditingCategory(null);
        setEditingTransaction(null);
        setDeletingCategory(null);
        setDeletingTransaction(null);
    };

    // Transactions are already filtered by the server
    // Only need to filter out invalid amounts
    const filteredTransactions = transactions.filter(
        (transaction) => !isNaN(transaction.amount)
    );

    // Separate transactions into spends and incomes (filter out invalid amounts)
    const spendTransactions = filteredTransactions.filter(
        (transaction) => transaction.amount < 0
    );
    const incomeTransactions = filteredTransactions.filter(
        (transaction) => transaction.amount >= 0
    );

    // Calculate totals
    const totalSpends = spendTransactions.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0
    );
    const totalIncomes = incomeTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
    );
    const totalAmount = filteredTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
    );

    const getCategoryName = (categoryId: number) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name || 'Unknown';
    };

    return (
        <div className='pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-gray-900 mb-8'>
                        Account Transactions
                    </h1>

                    {/* Filters */}
                    <div className='bg-white p-4 rounded-lg shadow mb-6'>
                        <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Search
                                </label>
                                <input
                                    type='text'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder='Search transactions...'
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Category
                                </label>
                                <CategorySelect
                                    categories={categories}
                                    placeholder='All Categories'
                                    value={selectedCategory}
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Year
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) =>
                                        setSelectedYear(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                >
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year =
                                            new Date().getFullYear() - 2 + i;
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
                                        setSelectedMonth(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    disabled={filterByYear}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                                >
                                    <option value={1}>January</option>
                                    <option value={2}>February</option>
                                    <option value={3}>March</option>
                                    <option value={4}>April</option>
                                    <option value={5}>May</option>
                                    <option value={6}>June</option>
                                    <option value={7}>July</option>
                                    <option value={8}>August</option>
                                    <option value={9}>September</option>
                                    <option value={10}>October</option>
                                    <option value={11}>November</option>
                                    <option value={12}>December</option>
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Filter
                                </label>
                                <div className='flex items-center space-x-2'>
                                    <button
                                        onClick={() => setFilterByYear(false)}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            !filterByYear
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setFilterByYear(true)}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            filterByYear
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Year
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    View
                                </label>
                                <div className='flex items-center space-x-2'>
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            viewMode === 'cards'
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        📋 Cards
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            viewMode === 'table'
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Table
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Transaction Button */}
                    <div className='flex justify-between items-center mb-4'>
                        <div className='flex items-center space-x-6'>
                            <span className='text-sm text-gray-500'>
                                {filteredTransactions.length} transaction
                                {filteredTransactions.length !== 1
                                    ? 's'
                                    : ''}{' '}
                                for{' '}
                                {filterByYear
                                    ? selectedYear
                                    : `${new Date(
                                          selectedYear,
                                          selectedMonth - 1
                                      ).toLocaleString('default', {
                                          month: 'long',
                                      })} ${selectedYear}`}
                            </span>
                            <div className='flex space-x-4 text-sm'>
                                <div>
                                    <span className='text-gray-500'>
                                        Spends:{' '}
                                    </span>
                                    <span className='font-semibold text-red-600'>
                                        {formatCurrency(totalSpends)}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-500'>
                                        Incomes:{' '}
                                    </span>
                                    <span className='font-semibold text-green-600'>
                                        {formatCurrency(totalIncomes)}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Net: </span>
                                    <span
                                        className={`font-semibold ${
                                            totalAmount >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='flex space-x-3'>
                            {viewMode === 'table' &&
                                selectedTransactions.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className='bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 border-2 border-red-800'
                                    >
                                        Delete Selected (
                                        {selectedTransactions.length})
                                    </button>
                                )}
                            <button
                                onClick={handleAddTransaction}
                                className='bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 border-2 border-green-800'
                            >
                                Add Transaction
                            </button>
                        </div>
                    </div>

                    {/* Transactions Display */}
                    {viewMode === 'cards' ? (
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                            {/* Spends Panel */}
                            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                                <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='text-lg font-medium text-red-900'>
                                            💸 Spends
                                        </h3>
                                        <span className='text-sm font-semibold text-red-600'>
                                            {formatCurrency(totalSpends)}
                                        </span>
                                    </div>
                                    <p className='text-sm text-red-700 mt-1'>
                                        {spendTransactions.length} transaction
                                        {spendTransactions.length !== 1
                                            ? 's'
                                            : ''}
                                    </p>
                                </div>
                                {transactionsLoading ? (
                                    <div className='p-6 text-center text-gray-500'>
                                        Loading...
                                    </div>
                                ) : spendTransactions.length === 0 ? (
                                    <div className='p-6 text-center text-gray-500'>
                                        No spending transactions found
                                    </div>
                                ) : (
                                    <ul className='divide-y divide-gray-200'>
                                        {spendTransactions.map(
                                            (transaction) => (
                                                <li
                                                    key={transaction.id}
                                                    className='px-6 py-4'
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <div className='flex-1'>
                                                            <div className='flex items-center justify-between'>
                                                                <div>
                                                                    <h3 className='text-sm font-medium text-gray-900'>
                                                                        {
                                                                            transaction.description
                                                                        }
                                                                    </h3>
                                                                    <p className='text-sm text-gray-500'>
                                                                        {getCategoryName(
                                                                            transaction.category
                                                                        )}{' '}
                                                                        •{' '}
                                                                        {new Date(
                                                                            transaction.date
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <div className='text-right'>
                                                                    <span className='text-lg font-semibold text-red-600'>
                                                                        {formatCurrency(
                                                                            transaction.amount
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='ml-4'>
                                                            <EditDeleteIconButtons
                                                                onEdit={() =>
                                                                    handleEditTransaction(
                                                                        transaction
                                                                    )
                                                                }
                                                                onDelete={() =>
                                                                    handleDeleteTransaction(
                                                                        transaction
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                )}
                            </div>

                            {/* Incomes Panel */}
                            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                                <div className='px-6 py-4 bg-green-50 border-b border-green-200'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='text-lg font-medium text-green-900'>
                                            💰 Incomes
                                        </h3>
                                        <span className='text-sm font-semibold text-green-600'>
                                            {formatCurrency(totalIncomes)}
                                        </span>
                                    </div>
                                    <p className='text-sm text-green-700 mt-1'>
                                        {incomeTransactions.length} transaction
                                        {incomeTransactions.length !== 1
                                            ? 's'
                                            : ''}
                                    </p>
                                </div>
                                {transactionsLoading ? (
                                    <div className='p-6 text-center text-gray-500'>
                                        Loading...
                                    </div>
                                ) : incomeTransactions.length === 0 ? (
                                    <div className='p-6 text-center text-gray-500'>
                                        No income transactions found
                                    </div>
                                ) : (
                                    <ul className='divide-y divide-gray-200'>
                                        {incomeTransactions.map(
                                            (transaction) => (
                                                <li
                                                    key={transaction.id}
                                                    className='px-6 py-4'
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <div className='flex-1'>
                                                            <div className='flex items-center justify-between'>
                                                                <div>
                                                                    <h3 className='text-sm font-medium text-gray-900'>
                                                                        {
                                                                            transaction.description
                                                                        }
                                                                    </h3>
                                                                    <p className='text-sm text-gray-500'>
                                                                        {getCategoryName(
                                                                            transaction.category
                                                                        )}{' '}
                                                                        •{' '}
                                                                        {new Date(
                                                                            transaction.date
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <div className='text-right'>
                                                                    <span className='text-lg font-semibold text-green-600'>
                                                                        {formatCurrency(
                                                                            transaction.amount
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='ml-4'>
                                                            <EditDeleteIconButtons
                                                                onEdit={() =>
                                                                    handleEditTransaction(
                                                                        transaction
                                                                    )
                                                                }
                                                                onDelete={() =>
                                                                    handleDeleteTransaction(
                                                                        transaction
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 border-b border-gray-200'>
                                <div className='flex items-center justify-between'>
                                    <h3 className='text-lg font-medium text-gray-900'>
                                        📊 All Transactions
                                    </h3>
                                    <div className='flex space-x-4 text-sm'>
                                        <div>
                                            <span className='text-gray-500'>
                                                Spends:{' '}
                                            </span>
                                            <span className='font-semibold text-red-600'>
                                                {formatCurrency(totalSpends)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='text-gray-500'>
                                                Incomes:{' '}
                                            </span>
                                            <span className='font-semibold text-green-600'>
                                                {formatCurrency(totalIncomes)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='text-gray-500'>
                                                Net:{' '}
                                            </span>
                                            <span
                                                className={`font-semibold ${
                                                    totalAmount >= 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {formatCurrency(totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className='text-sm text-gray-600 mt-1'>
                                    {filteredTransactions.length} transaction
                                    {filteredTransactions.length !== 1
                                        ? 's'
                                        : ''}
                                </p>
                            </div>
                            {transactionsLoading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading...
                                </div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No transactions found
                                </div>
                            ) : (
                                <div className='overflow-x-auto'>
                                    <table className='min-w-full divide-y divide-gray-200'>
                                        <thead className='bg-gray-50'>
                                            <tr>
                                                <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                    <input
                                                        type='checkbox'
                                                        checked={
                                                            selectedTransactions.length ===
                                                                filteredTransactions.length &&
                                                            filteredTransactions.length >
                                                                0
                                                        }
                                                        onChange={(e) =>
                                                            handleSelectAll(
                                                                e.target.checked
                                                            )
                                                        }
                                                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                                    />
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                    Date
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                    Description
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                    Category
                                                </th>
                                                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                    Amount
                                                </th>
                                                <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className='bg-white divide-y divide-gray-200'>
                                            {filteredTransactions.map(
                                                (transaction) => (
                                                    <tr
                                                        key={transaction.id}
                                                        className='hover:bg-gray-50'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-center text-sm'>
                                                            <input
                                                                type='checkbox'
                                                                checked={selectedTransactions.includes(
                                                                    transaction.id
                                                                )}
                                                                onChange={(e) =>
                                                                    handleSelectTransaction(
                                                                        transaction.id,
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                                            />
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                            {new Date(
                                                                transaction.date
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                                            {
                                                                transaction.description
                                                            }
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                            {getCategoryName(
                                                                transaction.category
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-right font-semibold'>
                                                            <span
                                                                className={
                                                                    transaction.amount >=
                                                                    0
                                                                        ? 'text-green-600'
                                                                        : 'text-red-600'
                                                                }
                                                            >
                                                                {formatCurrency(
                                                                    transaction.amount
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-center text-sm font-medium'>
                                                            <div className='flex justify-center'>
                                                                <EditDeleteIconButtons
                                                                    onEdit={() =>
                                                                        handleEditTransaction(
                                                                            transaction
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        handleDeleteTransaction(
                                                                            transaction
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bank Statement Upload */}
                <div className='mt-8'>
                    <BankStatementUpload />
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory || undefined}
                    onClose={closeModals}
                />
            </Modal>

            <Modal isOpen={showTransactionModal} onClose={closeModals}>
                <TransactionForm
                    transaction={editingTransaction || undefined}
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
                        <div className='mt-2'>
                            <div className='flex items-start'>
                                <div className='ml-3 w-full'>
                                    <h3 className='text-sm font-medium text-gray-800'>
                                        Delete Transaction
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-500'>
                                            You are about to permanently delete
                                            the transaction{' '}
                                            <span className='font-semibold text-gray-700'>
                                                "
                                                {
                                                    deletingTransaction?.description
                                                }
                                                "
                                            </span>
                                            . This action cannot be undone.
                                        </p>
                                    </div>
                                    {deletingTransaction && (
                                        <div className='mt-3 p-3 bg-gray-50 rounded-md'>
                                            <div className='text-sm'>
                                                <div className='grid grid-cols-2 gap-4'>
                                                    <div>
                                                        <span className='font-medium text-gray-700'>
                                                            Date:
                                                        </span>{' '}
                                                        <span className='text-gray-900'>
                                                            {new Date(
                                                                deletingTransaction.date
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className='font-medium text-gray-700'>
                                                            Amount:
                                                        </span>{' '}
                                                        <span className='text-gray-900 font-semibold'>
                                                            {formatCurrency(
                                                                deletingTransaction.amount
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <span className='font-medium text-gray-700'>
                                                            Description:
                                                        </span>{' '}
                                                        <span className='text-gray-900'>
                                                            {
                                                                deletingTransaction.description
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className='mt-3'>
                                        <p className='text-sm text-red-600 font-medium'>
                                            ⚠️ This will permanently remove this
                                            transaction from your records.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                }
                confirmLabel={deleting ? 'Deleting...' : 'Delete Transaction'}
                cancelLabel='Cancel'
                isDanger
                isConfirming={deleting}
            />

            {/* Bulk Delete Confirmation Modal */}
            <Modal
                isOpen={showBulkDeleteDialog}
                onClose={() => setShowBulkDeleteDialog(false)}
                title='Delete Transactions'
            >
                <div className='space-y-4'>
                    <p className='text-gray-700'>
                        Are you sure you want to delete{' '}
                        {selectedTransactions.length} selected transaction
                        {selectedTransactions.length !== 1 ? 's' : ''}?
                    </p>
                    <p className='text-sm text-gray-500'>
                        This action cannot be undone. The selected transactions
                        will be permanently removed from your account.
                    </p>
                </div>
                <div className='flex justify-end space-x-3 mt-6'>
                    <button
                        onClick={() => setShowBulkDeleteDialog(false)}
                        className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmBulkDelete}
                        disabled={isDeleting}
                        className='px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isDeleting ? (
                            <>
                                <svg
                                    className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                >
                                    <circle
                                        className='opacity-25'
                                        cx='12'
                                        cy='12'
                                        r='10'
                                        stroke='currentColor'
                                        strokeWidth='4'
                                    />
                                    <path
                                        className='opacity-75'
                                        fill='currentColor'
                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                    />
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <svg
                                    className='-ml-1 mr-2 h-4 w-4'
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                    />
                                </svg>
                                Delete Transactions
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default AccountTransactions;
