import React, { useEffect } from 'react';

import BalanceOverview from '../components/BalanceOverview';
import BankStatementUpload from '../components/BankStatementUpload';
import CategoryForm from '../components/CategoryForm';
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
import { formatCurrency } from '../utils/formatters';

interface Category {
    id: number;
    name: string;
    classification: string;
    monthly_budget: number;
}

interface Transaction {
    id: number;
    date: string;
    amount: string;
    description: string;
    category: number;
}

function Dashboard() {
    const dispatch = useAppDispatch();
    const { categories, loading: categoriesLoading } = useAppSelector(
        (state) => state.categories
    );
    const { transactions, loading: transactionsLoading } = useAppSelector(
        (state) => state.transactions
    );

    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [showTransactionModal, setShowTransactionModal] =
        React.useState(false);
    const [editingCategory, setEditingCategory] =
        React.useState<Category | null>(null);
    const [editingTransaction, setEditingTransaction] =
        React.useState<Transaction | null>(null);
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
        React.useState(false);
    const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
        React.useState(false);
    const [deletingCategory, setDeletingCategory] =
        React.useState<Category | null>(null);
    const [deletingTransaction, setDeletingTransaction] =
        React.useState<Transaction | null>(null);

    // Filter states
    const [selectedYear, setSelectedYear] = React.useState(
        new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = React.useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based
    const [filterByYear, setFilterByYear] = React.useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions());
    }, [dispatch]);

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setShowTransactionModal(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowTransactionModal(true);
    };

    const handleDeleteCategory = (category: Category) => {
        setDeletingCategory(category);
        setShowDeleteCategoryDialog(true);
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
                dispatch(fetchTransactions());
                setShowDeleteTransactionDialog(false);
                setDeletingTransaction(null);
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                alert('Failed to delete transaction. Please try again.');
            }
        }
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

    // Filter transactions and categories based on selected period
    const filteredTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        const transactionYear = transactionDate.getFullYear();
        const transactionMonth = transactionDate.getMonth() + 1; // JS months are 0-based
        const matchesPeriod = filterByYear
            ? transactionYear === selectedYear
            : transactionYear === selectedYear &&
              transactionMonth === selectedMonth;

        return matchesPeriod;
    });

    const filteredCategories = categories.filter((category) => {
        // Include categories that have transactions in the filtered period
        return filteredTransactions.some(
            (transaction) => transaction.category === category.id
        );
    });

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
                                    setSelectedMonth(parseInt(e.target.value))
                                }
                                disabled={filterByYear}
                                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
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
                        <div className='text-sm text-gray-500 self-end'>
                            {filteredTransactions.length} transaction
                            {filteredTransactions.length !== 1
                                ? 's'
                                : ''} for{' '}
                            {filterByYear
                                ? selectedYear
                                : `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
                        </div>
                    </div>
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
                                    <button
                                        onClick={handleAddCategory}
                                        className='bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 border-2 border-red-800'
                                    >
                                        ➕ Add Category
                                    </button>
                                </div>
                                <div className='mt-5'>
                                    {categoriesLoading ? (
                                        <p className='text-gray-500'>
                                            Loading...
                                        </p>
                                    ) : (
                                        <ul className='divide-y divide-gray-200'>
                                            {filteredCategories
                                                .slice(0, 5)
                                                .map((category) => (
                                                    <li
                                                        key={category.id}
                                                        className='py-2 flex justify-between items-center'
                                                    >
                                                        <span className='text-sm font-medium text-gray-900'>
                                                            {category.name}
                                                        </span>
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
                                                    </li>
                                                ))}
                                        </ul>
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
                                    <button
                                        onClick={handleAddTransaction}
                                        className='bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 border-2 border-red-800'
                                    >
                                        ➕ Add Transaction
                                    </button>
                                </div>
                                <div className='mt-5'>
                                    {transactionsLoading ? (
                                        <p className='text-gray-500'>
                                            Loading...
                                        </p>
                                    ) : (
                                        <ul className='divide-y divide-gray-200'>
                                            {filteredTransactions
                                                .slice(0, 5)
                                                .map((transaction) => (
                                                    <li
                                                        key={transaction.id}
                                                        className='py-2'
                                                    >
                                                        <div className='flex justify-between items-start'>
                                                            <div className='flex-1'>
                                                                <div className='flex justify-between'>
                                                                    <span className='text-sm font-medium text-gray-900'>
                                                                        {
                                                                            transaction.description
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        className={`text-sm font-medium ${parseFloat(transaction.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}
                                                                    >
                                                                        {formatCurrency(
                                                                            Math.abs(
                                                                                parseFloat(
                                                                                    transaction.amount
                                                                                )
                                                                            )
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p className='text-xs text-gray-500'>
                                                                    {new Date(
                                                                        transaction.date
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className='flex space-x-2'>
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditTransaction(
                                                                            transaction
                                                                        )
                                                                    }
                                                                    className='text-blue-600 hover:text-blue-800 text-sm'
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteTransaction(
                                                                            transaction
                                                                        )
                                                                    }
                                                                    className='text-red-600 hover:text-red-800 text-sm'
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                        </ul>
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
                    category={editingCategory}
                    onClose={closeModals}
                />
            </Modal>

            {/* Transaction Modal */}
            <Modal isOpen={showTransactionModal} onClose={closeModals}>
                <TransactionForm
                    transaction={editingTransaction}
                    onClose={closeModals}
                />
            </Modal>

            {/* Delete Category Confirmation Modal */}
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
                        {deletingCategory?.name}"? This action cannot be undone.
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

            {/* Delete Transaction Confirmation Modal */}
            <Modal
                isOpen={showDeleteTransactionDialog}
                onClose={() => setShowDeleteTransactionDialog(false)}
            >
                <div className='p-6'>
                    <h3 className='text-lg font-medium text-gray-900 mb-4'>
                        Delete Transaction
                    </h3>
                    <p className='text-sm text-gray-500 mb-4'>
                        Are you sure you want to delete the transaction "
                        {deletingTransaction?.description}"? This action cannot
                        be undone.
                    </p>
                    <div className='flex justify-end space-x-3'>
                        <button
                            onClick={() =>
                                setShowDeleteTransactionDialog(false)
                            }
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteTransaction}
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

export default Dashboard;
