import { useEffect, useState } from 'react';

import BalanceOverview from '../components/BalanceOverview';
import CategoryForm from '../components/CategoryForm';
import ConfirmModal from '../components/ConfirmModal';
import HeritageChart from '../components/HeritageChart';
import InvestmentsChart from '../components/InvestmentsChart';
import Modal from '../components/Modal';
import MonthlySpendingChart from '../components/MonthlySpendingChart';
import RetirementChart from '../components/RetirementChart';
import SpendingChart from '../components/SpendingChart';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';
import { fetchHeritages } from '../store/slices/heritagesSlice';
import { fetchInvestments } from '../store/slices/investmentsSlice';
import { fetchRetirementAccounts } from '../store/slices/retirementAccountsSlice';
import {
    deleteTransaction,
    fetchTransactions,
} from '../store/slices/transactionsSlice';
import type { Category } from '../types/categories';
import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';

function Home() {
    const dispatch = useAppDispatch();
    const { categories, loading: categoriesLoading } = useAppSelector(
        (state) => state.categories
    );
    const { transactions, loading: transactionsLoading } = useAppSelector(
        (state) => state.transactions
    );
    const { investments, loading: investmentsLoading } = useAppSelector(
        (state) => state.investments
    );
    const { heritages, loading: heritagesLoading } = useAppSelector(
        (state) => state.heritages
    );
    const { retirementAccounts, loading: retirementAccountsLoading } =
        useAppSelector((state) => state.retirementAccounts);

    const isLoading =
        categoriesLoading ||
        transactionsLoading ||
        investmentsLoading ||
        heritagesLoading ||
        retirementAccountsLoading;

    // Filter states
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based
    const [filterByYear, setFilterByYear] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
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
        dispatch(fetchInvestments());
        dispatch(fetchHeritages());
        dispatch(fetchRetirementAccounts());
    }, [dispatch]);

    // Filter transactions based on selected period
    const filteredTransactions = transactions.filter((transaction) => {
        try {
            const transactionDate = new Date(transaction.date);
            // Check if date is valid
            if (isNaN(transactionDate.getTime())) {
                return false;
            }
            const transactionYear = transactionDate.getFullYear();
            const transactionMonth = transactionDate.getMonth() + 1; // JS months are 0-based
            const matchesPeriod = filterByYear
                ? transactionYear === selectedYear
                : transactionYear === selectedYear &&
                  transactionMonth === selectedMonth;

            return matchesPeriod;
        } catch (error) {
            // Skip invalid transactions
            return false;
        }
    });

    const filteredCategories = categories.filter((category) => {
        // Include categories that have transactions in the filtered period
        return filteredTransactions.some(
            (transaction) => transaction.category === category.id
        );
    });

    // No Add transaction from Home; button and modal removed.

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
        setShowDeleteCategoryDialog(false);
        setShowDeleteTransactionDialog(false);
        setEditingCategory(null);
        setDeletingCategory(null);
        setDeletingTransaction(null);
    };

    return (
        <div className='min-h-screen bg-gray-100'>
            <main className='flex-1'>
                <div className='py-6'>
                    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                        {isLoading ? (
                            <div className='flex items-center justify-center min-h-screen'>
                                <div className='text-center'>
                                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4'></div>
                                    <p className='text-gray-600'>
                                        Loading dashboard...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className='mb-6'>
                                    <div className='flex items-start justify-between'>
                                        <div>
                                            <h1 className='text-2xl font-bold text-gray-900'>
                                                Dashboard
                                            </h1>
                                            <p className='text-sm text-gray-600 mt-6'>
                                                {filteredTransactions.length}{' '}
                                                transaction
                                                {filteredTransactions.length !==
                                                1
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
                                                            parseInt(
                                                                e.target.value
                                                            )
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
                                                            parseInt(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    disabled={filterByYear}
                                                    className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                                                >
                                                    <option value={1}>
                                                        January
                                                    </option>
                                                    <option value={2}>
                                                        February
                                                    </option>
                                                    <option value={3}>
                                                        March
                                                    </option>
                                                    <option value={4}>
                                                        April
                                                    </option>
                                                    <option value={5}>
                                                        May
                                                    </option>
                                                    <option value={6}>
                                                        June
                                                    </option>
                                                    <option value={7}>
                                                        July
                                                    </option>
                                                    <option value={8}>
                                                        August
                                                    </option>
                                                    <option value={9}>
                                                        September
                                                    </option>
                                                    <option value={10}>
                                                        October
                                                    </option>
                                                    <option value={11}>
                                                        November
                                                    </option>
                                                    <option value={12}>
                                                        December
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                                    Filter
                                                </label>
                                                <div className='flex items-center space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            setFilterByYear(
                                                                false
                                                            )
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
                                                            setFilterByYear(
                                                                true
                                                            )
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

                                <div className='mb-6'>
                                    <BalanceOverview
                                        transactions={filteredTransactions}
                                    />
                                </div>

                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                                    <div className='bg-white overflow-hidden shadow rounded-lg'>
                                        <div className='p-6'>
                                            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                                Spending by Category
                                            </h3>
                                            <SpendingChart
                                                transactions={
                                                    filteredTransactions
                                                }
                                                categories={filteredCategories}
                                            />
                                        </div>
                                    </div>

                                    <div className='bg-white overflow-hidden shadow rounded-lg'>
                                        <div className='p-6'>
                                            <div className='flex items-center justify-between mb-4'>
                                                <h3 className='text-lg leading-6 font-medium text-gray-900'>
                                                    Recent Transactions
                                                </h3>
                                            </div>
                                            <div className='space-y-3'>
                                                {transactionsLoading ? (
                                                    <p className='text-gray-500 text-center py-4'>
                                                        Loading...
                                                    </p>
                                                ) : filteredTransactions.length ===
                                                  0 ? (
                                                    <p className='text-gray-500 text-center py-4'>
                                                        No transactions for this
                                                        period
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
                                                                key={
                                                                    transaction.id
                                                                }
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
                                                                            parseFloat(String(transaction.amount)) <
                                                                            0
                                                                                ? 'text-red-600'
                                                                                : 'text-green-600'
                                                                        }`}
                                                                    >
                                                                        {formatCurrency(
                                                                            parseFloat(String(transaction.amount))
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

                                <div className='mb-6'>
                                    <div className='bg-white overflow-hidden shadow rounded-lg'>
                                        <div className='p-6'>
                                            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                                Annual Spending Trends
                                            </h3>
                                            <MonthlySpendingChart
                                                transactions={
                                                    filteredTransactions
                                                }
                                                year={selectedYear}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='mb-6'>
                                    <div className='bg-white overflow-hidden shadow rounded-lg'>
                                        <div className='p-6'>
                                            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                                Investments Overview
                                            </h3>
                                            <InvestmentsChart
                                                investments={investments}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='mb-6'>
                                    <div className='bg-white overflow-hidden shadow rounded-lg'>
                                        <div className='p-6'>
                                            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                                Heritage Overview
                                            </h3>
                                            <HeritageChart
                                                heritages={heritages}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='mb-6'>
                                    <div className='bg-white overflow-hidden shadow rounded-lg'>
                                        <div className='p-6'>
                                            <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                                                Retirement Overview
                                            </h3>
                                            <RetirementChart
                                                retirementAccounts={
                                                    retirementAccounts
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory ?? undefined}
                    onClose={closeModals}
                />
            </Modal>

            {/* Transaction modal removed: transactions are not added from Home view */}

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

export default Home;
