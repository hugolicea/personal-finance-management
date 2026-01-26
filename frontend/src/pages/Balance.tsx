import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchCategories,
    fetchCategorySpending,
} from '../store/slices/categoriesSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';

function Balance() {
    const dispatch = useAppDispatch();
    const {
        categories,
        categorySpending,
        loading: categoriesLoading,
    } = useAppSelector((state) => state.categories);
    const { transactions } = useAppSelector((state) => state.transactions);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based
    const [showOnlyWithTransactions, setShowOnlyWithTransactions] =
        useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions());
        dispatch(
            fetchCategorySpending(
                `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`
            )
        );
    }, [dispatch, selectedYear, selectedMonth]);

    // Add error handling for categorySpending fetch
    useEffect(() => {
        if (categorySpending && categorySpending.length === 0) {
            // If categorySpending is empty, try fetching again
            dispatch(
                fetchCategorySpending(
                    `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`
                )
            );
        }
    }, [categorySpending, selectedYear, selectedMonth, dispatch]);

    // Calculate category statistics
    const getCategoryStats = (categoryId: number) => {
        // Filter transactions by category and selected period
        const categoryTransactions = transactions.filter((t) => {
            if (t.category !== categoryId) return false;

            const transactionDate = new Date(t.date);
            const transactionYear = transactionDate.getFullYear();
            const transactionMonth = transactionDate.getMonth() + 1; // JS months are 0-based

            return (
                transactionYear === selectedYear &&
                transactionMonth === selectedMonth
            );
        });

        const spendTransactions = categoryTransactions.filter(
            (t) => parseFloat(t.amount) < 0
        );
        const incomeTransactions = categoryTransactions.filter(
            (t) => parseFloat(t.amount) >= 0
        );

        const totalSpends = spendTransactions.reduce(
            (sum, t) => sum + parseFloat(t.amount),
            0
        );
        const totalIncomes = incomeTransactions.reduce(
            (sum, t) => sum + parseFloat(t.amount),
            0
        );
        const transactionCount = categoryTransactions.length;
        const spendCount = spendTransactions.length;
        const incomeCount = incomeTransactions.length;

        return {
            count: transactionCount,
            spendCount,
            incomeCount,
            totalSpends,
            totalIncomes,
            total: totalSpends + totalIncomes,
            average:
                transactionCount > 0
                    ? (totalSpends + totalIncomes) / transactionCount
                    : 0,
        };
    };

    // Get spending data for a category
    const getCategorySpending = (categoryId: number) => {
        return categorySpending.find((spending) => spending.id === categoryId);
    };

    // Separate categories into spends and incomes
    const spendCategories = categories.filter((category) => {
        const stats = getCategoryStats(category.id);
        return showOnlyWithTransactions || stats.spendCount > 0;
    });

    const incomeCategories = categories.filter((category) => {
        const stats = getCategoryStats(category.id);
        return showOnlyWithTransactions || stats.incomeCount > 0;
    });

    return (
        <div className='pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-gray-900 mb-8'>
                        Balance Analysis
                    </h1>

                    {/* Period Selection */}
                    <div className='flex justify-between items-center mb-4'>
                        <div className='flex items-center space-x-4'>
                            <label
                                htmlFor='year-select'
                                className='text-sm font-medium text-gray-700'
                            >
                                Year:
                            </label>
                            <select
                                id='year-select'
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(parseInt(e.target.value))
                                }
                                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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

                            <label
                                htmlFor='month-select'
                                className='text-sm font-medium text-gray-700'
                            >
                                Month:
                            </label>
                            <select
                                id='month-select'
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(parseInt(e.target.value))
                                }
                                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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

                        <div className='flex items-center space-x-4'>
                            <label className='flex items-center'>
                                <input
                                    type='checkbox'
                                    checked={showOnlyWithTransactions}
                                    onChange={(e) =>
                                        setShowOnlyWithTransactions(
                                            e.target.checked
                                        )
                                    }
                                    className='rounded border-gray-300 text-red-600 focus:ring-red-500'
                                />
                                <span className='ml-2 text-sm text-gray-700'>
                                    Show all categories
                                </span>
                            </label>
                        </div>
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
                            {categoriesLoading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading categories...
                                </div>
                            ) : spendCategories.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No spending categories found
                                </div>
                            ) : (
                                <div className='divide-y divide-gray-200'>
                                    {spendCategories.map((category) => {
                                        const stats = getCategoryStats(
                                            category.id
                                        );
                                        if (stats.spendCount === 0) return null;
                                        return (
                                            <div
                                                key={`spend-${category.id}`}
                                                className='p-6'
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <h3 className='text-lg font-medium text-gray-900'>
                                                        {category.name}
                                                    </h3>
                                                </div>

                                                {/* Category Statistics */}
                                                <div className='mt-4 pt-4 border-t border-gray-200'>
                                                    <div className='space-y-2'>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Spending
                                                                Transactions
                                                            </span>
                                                            <span className='text-lg font-semibold'>
                                                                {
                                                                    stats.spendCount
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Total Spent
                                                            </span>
                                                            <span className='text-lg font-semibold text-red-600'>
                                                                $
                                                                {Math.abs(
                                                                    stats.totalSpends
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Budget
                                                            </span>
                                                            <span className='text-lg font-semibold text-blue-600'>
                                                                $
                                                                {category.monthly_budget
                                                                    ? parseFloat(
                                                                          category.monthly_budget
                                                                      ).toFixed(
                                                                          2
                                                                      )
                                                                    : '0.00'}
                                                            </span>
                                                        </div>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Remaining Budget
                                                            </span>
                                                            <span
                                                                className={`text-lg font-semibold ${
                                                                    (category.monthly_budget
                                                                        ? parseFloat(
                                                                              category.monthly_budget
                                                                          )
                                                                        : 0) +
                                                                        stats.totalSpends >=
                                                                    0
                                                                        ? 'text-green-600'
                                                                        : 'text-red-600'
                                                                }`}
                                                            >
                                                                $
                                                                {(
                                                                    (category.monthly_budget
                                                                        ? parseFloat(
                                                                              category.monthly_budget
                                                                          )
                                                                        : 0) +
                                                                    stats.totalSpends
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Avg per
                                                                Transaction
                                                            </span>
                                                            <span className='text-lg font-semibold text-gray-700'>
                                                                $
                                                                {stats.spendCount >
                                                                0
                                                                    ? Math.abs(
                                                                          stats.totalSpends /
                                                                              stats.spendCount
                                                                      ).toFixed(
                                                                          2
                                                                      )
                                                                    : '0.00'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                            {categoriesLoading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading categories...
                                </div>
                            ) : incomeCategories.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No income categories found
                                </div>
                            ) : (
                                <div className='divide-y divide-gray-200'>
                                    {incomeCategories.map((category) => {
                                        const stats = getCategoryStats(
                                            category.id
                                        );
                                        if (stats.incomeCount === 0)
                                            return null;
                                        return (
                                            <div
                                                key={`income-${category.id}`}
                                                className='p-6'
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <h3 className='text-lg font-medium text-gray-900'>
                                                        {category.name}
                                                    </h3>
                                                </div>

                                                {/* Category Statistics */}
                                                <div className='mt-4 pt-4 border-t border-gray-200'>
                                                    <div className='space-y-2'>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Income
                                                                Transactions
                                                            </span>
                                                            <span className='text-lg font-semibold'>
                                                                {
                                                                    stats.incomeCount
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Total Income
                                                            </span>
                                                            <span className='text-lg font-semibold text-green-600'>
                                                                $
                                                                {stats.totalIncomes.toFixed(
                                                                    2
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-sm text-gray-500'>
                                                                Avg per
                                                                Transaction
                                                            </span>
                                                            <span className='text-lg font-semibold text-gray-700'>
                                                                $
                                                                {stats.incomeCount >
                                                                0
                                                                    ? (
                                                                          stats.totalIncomes /
                                                                          stats.incomeCount
                                                                      ).toFixed(
                                                                          2
                                                                      )
                                                                    : '0.00'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Balance;
