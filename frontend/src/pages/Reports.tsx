import { useEffect, useState } from 'react';

import {
    eachMonthOfInterval,
    endOfMonth,
    format,
    startOfMonth,
    subMonths,
} from 'date-fns';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import Navigation from '../components/Navigation';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import { formatCurrency } from '../utils/formatters';

function Reports() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const { transactions } = useAppSelector((state) => state.transactions);

    const [selectedPeriod, setSelectedPeriod] = useState<
        '3months' | '6months' | '1year' | 'all'
    >('6months');

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions({}));
    }, [dispatch]);

    // Calculate monthly data for charts
    const getMonthlyData = () => {
        const now = new Date();
        let startDate: Date;

        switch (selectedPeriod) {
            case '3months':
                startDate = subMonths(now, 3);
                break;
            case '6months':
                startDate = subMonths(now, 6);
                break;
            case '1year':
                startDate = subMonths(now, 12);
                break;
            case 'all':
                startDate = new Date(
                    Math.min(
                        ...transactions.map((t) => new Date(t.date).getTime())
                    )
                );
                break;
        }

        const months = eachMonthOfInterval({ start: startDate, end: now });

        return months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);

            const monthTransactions = transactions.filter((t) => {
                const transactionDate = new Date(t.date);
                return (
                    transactionDate >= monthStart && transactionDate <= monthEnd
                );
            });

            const income = monthTransactions
                .filter((t) => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = Math.abs(
                monthTransactions
                    .filter((t) => t.amount < 0)
                    .reduce((sum, t) => sum + t.amount, 0)
            );

            const net = income - expenses;

            return {
                month: format(month, 'MMM yyyy'),
                income,
                expenses,
                net,
            };
        });
    };

    // Calculate category spending data
    const getCategorySpendingData = () => {
        const categoryTotals: Record<
            number,
            { name: string; amount: number; count: number }
        > = {};

        transactions
            .filter((t) => t.amount < 0)
            .forEach((transaction) => {
                const categoryId = transaction.category;
                const amount = Math.abs(transaction.amount);

                if (!categoryTotals[categoryId]) {
                    const category = categories.find(
                        (c) => c.id === categoryId
                    );
                    categoryTotals[categoryId] = {
                        name: category?.name || `Category ${categoryId}`,
                        amount: 0,
                        count: 0,
                    };
                }

                categoryTotals[categoryId]!.amount += amount;
                categoryTotals[categoryId]!.count += 1;
            });

        return Object.values(categoryTotals)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10); // Top 10 categories
    };

    const monthlyData = getMonthlyData();
    const categoryData = getCategorySpendingData();

    // Calculate summary statistics
    const totalIncome = transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = Math.abs(
        transactions
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0)
    );

    const netBalance = totalIncome - totalExpenses;
    const transactionCount = transactions.length;

    return (
        <div className='min-h-screen bg-gray-100'>
            <Navigation />

            <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                <div className='px-4 py-6 sm:px-0'>
                    <div className='mb-6'>
                        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                            Financial Reports
                        </h1>

                        {/* Period Selector */}
                        <div className='mb-6'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Report Period
                            </label>
                            <select
                                value={selectedPeriod}
                                onChange={(e) =>
                                    setSelectedPeriod(
                                        e.target.value as
                                            | '3months'
                                            | '6months'
                                            | '1year'
                                            | 'all'
                                    )
                                }
                                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                            >
                                <option value='3months'>Last 3 Months</option>
                                <option value='6months'>Last 6 Months</option>
                                <option value='1year'>Last Year</option>
                                <option value='all'>All Time</option>
                            </select>
                        </div>

                        {/* Summary Cards */}
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
                            <div className='bg-white overflow-hidden shadow rounded-lg'>
                                <div className='p-5'>
                                    <div className='flex items-center'>
                                        <div className='flex-shrink-0'>
                                            <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
                                                <span className='text-white text-sm font-bold'>
                                                    💰
                                                </span>
                                            </div>
                                        </div>
                                        <div className='ml-5 w-0 flex-1'>
                                            <dl>
                                                <dt className='text-sm font-medium text-gray-500 truncate'>
                                                    Total Income
                                                </dt>
                                                <dd className='text-lg font-medium text-gray-900'>
                                                    {formatCurrency(
                                                        totalIncome
                                                    )}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='bg-white overflow-hidden shadow rounded-lg'>
                                <div className='p-5'>
                                    <div className='flex items-center'>
                                        <div className='flex-shrink-0'>
                                            <div className='w-8 h-8 bg-red-500 rounded-md flex items-center justify-center'>
                                                <span className='text-white text-sm font-bold'>
                                                    💸
                                                </span>
                                            </div>
                                        </div>
                                        <div className='ml-5 w-0 flex-1'>
                                            <dl>
                                                <dt className='text-sm font-medium text-gray-500 truncate'>
                                                    Total Expenses
                                                </dt>
                                                <dd className='text-lg font-medium text-gray-900'>
                                                    {formatCurrency(
                                                        totalExpenses
                                                    )}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='bg-white overflow-hidden shadow rounded-lg'>
                                <div className='p-5'>
                                    <div className='flex items-center'>
                                        <div className='flex-shrink-0'>
                                            <div
                                                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                                    netBalance >= 0
                                                        ? 'bg-green-500'
                                                        : 'bg-red-500'
                                                }`}
                                            >
                                                <span className='text-white text-sm font-bold'>
                                                    {netBalance >= 0
                                                        ? '📈'
                                                        : '📉'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='ml-5 w-0 flex-1'>
                                            <dl>
                                                <dt className='text-sm font-medium text-gray-500 truncate'>
                                                    Net Balance
                                                </dt>
                                                <dd
                                                    className={`text-lg font-medium ${
                                                        netBalance >= 0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }`}
                                                >
                                                    {formatCurrency(netBalance)}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='bg-white overflow-hidden shadow rounded-lg'>
                                <div className='p-5'>
                                    <div className='flex items-center'>
                                        <div className='flex-shrink-0'>
                                            <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
                                                <span className='text-white text-sm font-bold'>
                                                    📊
                                                </span>
                                            </div>
                                        </div>
                                        <div className='ml-5 w-0 flex-1'>
                                            <dl>
                                                <dt className='text-sm font-medium text-gray-500 truncate'>
                                                    Transactions
                                                </dt>
                                                <dd className='text-lg font-medium text-gray-900'>
                                                    {transactionCount}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                            {/* Income vs Expenses Trend */}
                            <div className='bg-white p-6 rounded-lg shadow'>
                                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                                    Income vs Expenses Trend
                                </h3>
                                <div className='h-80'>
                                    <ResponsiveContainer
                                        width='100%'
                                        height='100%'
                                    >
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis dataKey='month' />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(
                                                    value: number | undefined
                                                ) => [
                                                    formatCurrency(value ?? 0),
                                                    '',
                                                ]}
                                            />
                                            <Legend />
                                            <Line
                                                type='monotone'
                                                dataKey='income'
                                                stroke='#22c55e'
                                                strokeWidth={2}
                                                name='Income'
                                            />
                                            <Line
                                                type='monotone'
                                                dataKey='expenses'
                                                stroke='#ef4444'
                                                strokeWidth={2}
                                                name='Expenses'
                                            />
                                            <Line
                                                type='monotone'
                                                dataKey='net'
                                                stroke='#3b82f6'
                                                strokeWidth={2}
                                                name='Net'
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Spending Categories */}
                            <div className='bg-white p-6 rounded-lg shadow'>
                                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                                    Top Spending Categories
                                </h3>
                                <div className='h-80'>
                                    <ResponsiveContainer
                                        width='100%'
                                        height='100%'
                                    >
                                        <BarChart
                                            data={categoryData}
                                            layout='horizontal'
                                        >
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis type='number' />
                                            <YAxis
                                                dataKey='name'
                                                type='category'
                                                width={100}
                                            />
                                            <Tooltip
                                                formatter={(
                                                    value: number | undefined
                                                ) => [
                                                    formatCurrency(value ?? 0),
                                                    'Amount',
                                                ]}
                                            />
                                            <Bar
                                                dataKey='amount'
                                                fill='#ef4444'
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Reports;
