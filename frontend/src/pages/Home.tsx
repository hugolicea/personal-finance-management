import { useEffect, useState } from 'react';

import BalanceOverview from '../components/BalanceOverview';
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

function Home() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const { transactions, loading: transactionsLoading } = useAppSelector(
        (state) => state.transactions
    );

    // Filter states
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based
    const [filterByYear, setFilterByYear] = useState(false);
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

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions());
    }, [dispatch]);

    // Filter transactions based on selected period
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

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setShowTransactionModal(true);
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

    return (
        <div className='min-h-screen bg-gray-100'>
            <main className='flex-1'>
                <div className='py-6'>
                    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                        {/* Header with period selector */}
                        <div className='mb-6'>
                            <div className='flex items-start justify-between'>
                                <div>
                                    <h1 className='text-2xl font-bold text-gray-900'>
                                        Dashboard
                                    </h1>
                                    <p className='text-sm text-gray-600 mt-6'>
                                        {filteredTransactions.length}{' '}
                                        transaction
                                        {filteredTransactions.length !== 1
                                            ? 's'
                                            : ''}{' '}
                                        for{' '}
                                        {filterByYear
                                            ? selectedYear
                                            : `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
                                    </p>
                                </div>
                                <div className='flex flex-wrap items-center gap-4 mt-12'>
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
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                        >
                                            {Array.from(
                                                { length: 5 },
                                                (_, i) => {
                                                    const year =
                                                        new Date().getFullYear() -
                                                        2 +
                                                        i;
                                                    return (
                                                        <option
                                                            key={year}
                                                            value={year}
                                                        >
                                                            {year}
                                                        </option>
                                                    );
                                                }
                                            )}
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
                                                onClick={() =>
                                                    setFilterByYear(false)
                                                }
                                                className={`px-3 py-2 text-sm rounded-md border ${
                                                    !filterByYear
                                                        ? 'bg-red-600 text-white border-red-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                Month
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setFilterByYear(true)
                                                }
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
                                </div>
                            </div>
                        </div>

                        {/* Balance Overview */}
                        <div className='mb-6'>
                            <BalanceOverview
                                transactions={filteredTransactions}
                            />
                        </div>

                        {/* Charts and Recent Activity */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                            {/* Spending Chart */}
                            <div className='bg-white overflow-hidden shadow rounded-lg'>
                                <div className='p-6'>
                                    <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                        Spending by Category
                                    </h3>
                                    <SpendingChart
                                        transactions={filteredTransactions}
                                        categories={filteredCategories}
                                    />
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className='bg-white overflow-hidden shadow rounded-lg'>
                                <div className='p-6'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h3 className='text-lg leading-6 font-medium text-gray-900'>
                                            Recent Transactions
                                        </h3>
                                        <button
                                            onClick={handleAddTransaction}
                                            className='bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div className='space-y-3'>
                                        {transactionsLoading ? (
                                            <p className='text-gray-500 text-center py-4'>
                                                Loading...
                                            </p>
                                        ) : filteredTransactions.length ===
                                          0 ? (
                                            <p className='text-gray-500 text-center py-4'>
                                                No transactions for this period
                                            </p>
                                        ) : (
                                            filteredTransactions
                                                .sort(
                                                    (a, b) =>
                                                        new Date(
                                                            b.date
                                                        ).getTime() -
                                                        new Date(
                                                            a.date
                                                        ).getTime()
                                                )
                                                .slice(0, 5)
                                                .map((transaction) => (
                                                    <div
                                                        key={transaction.id}
                                                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                                                    >
                                                        <div className='flex-1'>
                                                            <p className='text-sm font-medium text-gray-900'>
                                                                {
                                                                    transaction.description
                                                                }
                                                            </p>
                                                            <p className='text-xs text-gray-500'>
                                                                {new Date(
                                                                    transaction.date
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className='text-right'>
                                                            <p
                                                                className={`text-sm font-semibold ${
                                                                    parseFloat(
                                                                        transaction.amount
                                                                    ) < 0
                                                                        ? 'text-red-600'
                                                                        : 'text-green-600'
                                                                }`}
                                                            >
                                                                {formatCurrency(
                                                                    parseFloat(
                                                                        transaction.amount
                                                                    )
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className='bg-white overflow-hidden shadow rounded-lg'>
                            <div className='p-6'>
                                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                    Quick Actions
                                </h3>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                                    <button
                                        onClick={handleAddTransaction}
                                        className='flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                    >
                                        <span className='mr-2'>💳</span>
                                        Add Transaction
                                    </button>
                                    <button
                                        onClick={handleAddCategory}
                                        className='flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                    >
                                        <span className='mr-2'>🏷️</span>
                                        Add Category
                                    </button>
                                    <div className='flex items-center justify-center px-4 py-3 text-sm text-gray-500'>
                                        <span className='mr-2'>📊</span>
                                        {filteredTransactions.length}{' '}
                                        transactions
                                    </div>
                                    <div className='flex items-center justify-center px-4 py-3 text-sm text-gray-500'>
                                        <span className='mr-2'>🏷️</span>
                                        {categories.length} categories
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory}
                    onClose={closeModals}
                />
            </Modal>

            <Modal isOpen={showTransactionModal} onClose={closeModals}>
                <TransactionForm
                    transaction={editingTransaction}
                    onClose={closeModals}
                />
            </Modal>

            {/* Delete Confirmation Modals */}
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

export default Home;
