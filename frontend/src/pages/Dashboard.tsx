import React, { useEffect, useMemo } from 'react';

import axios from 'axios';

import BalanceOverview from '../components/BalanceOverview';
import HeritageChart from '../components/HeritageChart';
import InvestmentsChart from '../components/InvestmentsChart';
import MonthlySpendingChart from '../components/MonthlySpendingChart';
import RetirementChart from '../components/RetirementChart';
import SpendingChart from '../components/SpendingChart';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchHeritages } from '../store/slices/heritagesSlice';
import { fetchInvestments } from '../store/slices/investmentsSlice';
import { fetchRetirementAccounts } from '../store/slices/retirementAccountsSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';

function Dashboard() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const { transactions } = useAppSelector((state) => state.transactions);
    const { investments } = useAppSelector((state) => state.investments);
    const { heritages } = useAppSelector((state) => state.heritages);
    const { retirementAccounts } = useAppSelector(
        (state) => state.retirementAccounts
    );

    // Filter states
    const [selectedYear, setSelectedYear] = React.useState(
        new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = React.useState(
        new Date().getMonth() + 1
    );
    const [filterByYear, setFilterByYear] = React.useState(false);

    useEffect(() => {
        console.log('🚀 [Dashboard] First useEffect STARTED');
        dispatch(fetchCategories());
        dispatch(fetchInvestments());
        dispatch(fetchHeritages());
        dispatch(fetchRetirementAccounts());

        // Fetch all transactions directly for annual expense calculations
        // Use axios instead of Redux to avoid race condition with filtered fetch
        console.log(
            '[Dashboard] Fetching ALL transactions for annual expenses...'
        );

        const fetchUrl = '/api/v1/transactions/?page_size=5000';
        console.log('[Dashboard] About to call axios.get with URL:', fetchUrl);

        axios
            .get(fetchUrl)
            .then((response) => {
                const data = response.data.results || response.data;
                console.log(
                    '[Dashboard] Extracted transactions count:',
                    data.length
                );
                console.log(
                    '[Dashboard] Transactions loaded:',
                    data.length,
                    'items'
                );
            })
            .catch((error) => {
                console.error(
                    '[Dashboard] ❌ Axios FAILED - Failed to fetch all transactions:',
                    error
                );
            });

        console.log(
            '🚀 [Dashboard] First useEffect COMPLETED (axios call initiated)'
        );
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

        console.log('[Dashboard] Fetching FILTERED transactions:', {
            filterByYear,
            selectedYear,
            selectedMonth,
            dateAfter,
            dateBefore,
        });

        dispatch(
            fetchTransactions({
                date_after: dateAfter,
                date_before: dateBefore,
                ordering: '-date',
            })
        );
    }, [dispatch, filterByYear, selectedYear, selectedMonth]);

    // Transactions are already filtered by the server, no need for client-side filtering
    const filteredTransactions = transactions;

    const filteredCategories = useMemo(() => {
        return categories.filter((category) =>
            transactions.some(
                (transaction) => transaction.category === category.id
            )
        );
    }, [categories, transactions]);

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
                    {filteredTransactions.length !== 1 ? 's' : ''} for{' '}
                    {filterByYear
                        ? selectedYear
                        : `${new Date(
                              selectedYear,
                              selectedMonth - 1
                          ).toLocaleString('default', {
                              month: 'long',
                          })} ${selectedYear}`}
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
            {/* Header */}
            <header className='bg-white shadow-sm border-b border-gray-200'>
                <div className='max-w-[1600px] mx-auto py-12 px-4 sm:px-6 lg:px-8'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900'>
                                Dashboard
                            </h1>
                            <p className='mt-1 text-sm text-gray-500'>
                                Overview of your financial portfolio
                            </p>
                        </div>
                        <div className='text-right'>
                            <p className='text-sm text-gray-500'>
                                Last Updated
                            </p>
                            <p className='text-sm font-medium text-gray-900'>
                                {new Date().toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className='bg-white border-b border-gray-200'>
                <div className='max-w-[1600px] mx-auto py-5 px-4 sm:px-6 lg:px-8'>
                    <DashboardFilters />
                </div>
            </div>

            <main className='max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8'>
                <div className='space-y-8'>
                    {/* Balance Overview */}
                    <div className='transform transition-all duration-200 hover:scale-[1.01]'>
                        <BalanceOverview transactions={filteredTransactions} />
                    </div>
                    {/* First Row - 2 Spending Charts */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Monthly/Yearly Spending Chart */}
                        <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
                            <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center'>
                                        <svg
                                            className='h-6 w-6 text-white'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                            />
                                        </svg>
                                        <h3 className='ml-3 text-lg font-semibold text-white'>
                                            {filterByYear
                                                ? `Spending Breakdown - ${selectedYear}`
                                                : `Spending - ${new Date(
                                                      selectedYear,
                                                      selectedMonth - 1
                                                  ).toLocaleString('default', {
                                                      month: 'long',
                                                  })} ${selectedYear}`}
                                        </h3>
                                    </div>
                                    <span className='text-sm text-white/80'>
                                        {filteredTransactions.length}{' '}
                                        transaction
                                        {filteredTransactions.length !== 1
                                            ? 's'
                                            : ''}
                                    </span>
                                </div>
                            </div>
                            <div className='p-6'>
                                <MonthlySpendingChart
                                    transactions={filteredTransactions}
                                    year={selectedYear}
                                />
                            </div>
                        </div>

                        {/* Spending by Category */}
                        <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
                            <div className='bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4'>
                                <div className='flex items-center'>
                                    <svg
                                        className='h-6 w-6 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'
                                        />
                                    </svg>
                                    <h3 className='ml-3 text-lg font-semibold text-white'>
                                        Spending by Category
                                    </h3>
                                </div>
                            </div>
                            <div className='p-6'>
                                <SpendingChart
                                    transactions={filteredTransactions}
                                    categories={filteredCategories}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Second Row - Investments and Heritage (Full Width) */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Investments Chart */}
                        <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
                            <div className='bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4'>
                                <div className='flex items-center'>
                                    <svg
                                        className='h-6 w-6 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                                        />
                                    </svg>
                                    <h3 className='ml-3 text-lg font-semibold text-white'>
                                        Investments
                                    </h3>
                                </div>
                            </div>
                            <div className='p-6'>
                                <InvestmentsChart investments={investments} />
                            </div>
                        </div>

                        {/* Heritage Chart */}
                        <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
                            <div className='bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4'>
                                <div className='flex items-center'>
                                    <svg
                                        className='h-6 w-6 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                                        />
                                    </svg>
                                    <h3 className='ml-3 text-lg font-semibold text-white'>
                                        Heritage
                                    </h3>
                                </div>
                            </div>
                            <div className='p-6'>
                                <HeritageChart heritages={heritages} />
                            </div>
                        </div>
                    </div>

                    {/* Third Row - Retirement (Full Width) */}
                    <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
                        <div className='bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4'>
                            <div className='flex items-center'>
                                <svg
                                    className='h-6 w-6 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                                <h3 className='ml-3 text-lg font-semibold text-white'>
                                    Retirement
                                </h3>
                            </div>
                        </div>
                        <div className='p-6'>
                            <RetirementChart
                                retirementAccounts={retirementAccounts}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
