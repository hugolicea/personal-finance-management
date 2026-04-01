import {
    memo,
    useCallback,
    useDeferredValue,
    useMemo,
    useState,
    useTransition,
} from 'react';

import BalanceOverview from '../components/BalanceOverview';
import HeritageChart from '../components/HeritageChart';
import InvestmentsChart from '../components/InvestmentsChart';
import MonthlySpendingChart from '../components/MonthlySpendingChart';
import NetWorthView from '../components/NetWorthView';
import RetirementChart from '../components/RetirementChart';
import SpendingChart from '../components/SpendingChart';
import { useCategoriesQuery } from '../hooks/queries/useCategoriesQuery';
import { useHeritagesQuery } from '../hooks/queries/useHeritagesQuery';
import { useInvestmentsQuery } from '../hooks/queries/useInvestmentsQuery';
import { useRetirementAccountsQuery } from '../hooks/queries/useRetirementAccountsQuery';
import { useTransactionsQuery } from '../hooks/queries/useTransactionsQuery';

// Memoized filter component to prevent unnecessary re-renders
interface DashboardFiltersProps {
    selectedYear: number;
    selectedMonth: number;
    filterByYear: boolean;
    transactionCount: number;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
    onFilterToggle: (byYear: boolean) => void;
}

const DashboardFilters = memo(
    ({
        selectedYear,
        selectedMonth,
        filterByYear,
        transactionCount,
        onYearChange,
        onMonthChange,
        onFilterToggle,
    }: DashboardFiltersProps) => {
        return (
            <div className='flex flex-wrap items-center gap-4'>
                <div>
                    <label className='block text-sm font-medium mb-1'>
                        Year
                    </label>
                    <select
                        value={selectedYear}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        className='select select-bordered select-sm'
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
                    <label className='block text-sm font-medium mb-1'>
                        Month
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) =>
                            onMonthChange(parseInt(e.target.value))
                        }
                        disabled={filterByYear}
                        className='select select-bordered select-sm disabled:bg-base-200 disabled:cursor-not-allowed'
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
                    <label className='block text-sm font-medium mb-1'>
                        Filter
                    </label>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() => onFilterToggle(false)}
                            className={`btn btn-sm ${
                                !filterByYear
                                    ? 'btn-active btn-accent'
                                    : 'btn-outline'
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => onFilterToggle(true)}
                            className={`btn btn-sm ${
                                filterByYear
                                    ? 'btn-active btn-accent'
                                    : 'btn-outline'
                            }`}
                        >
                            Year
                        </button>
                    </div>
                </div>
                <div className='text-sm opacity-60 self-end'>
                    {transactionCount} transaction
                    {transactionCount !== 1 ? 's' : ''} for{' '}
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
);

DashboardFilters.displayName = 'DashboardFilters';

function Dashboard() {
    const { data: categories = [] } = useCategoriesQuery();
    const { data: investments = [] } = useInvestmentsQuery();
    const { data: heritages = [] } = useHeritagesQuery();
    const { data: retirementAccounts = [] } = useRetirementAccountsQuery();

    // Filter states
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [filterByYear, setFilterByYear] = useState(false);
    const [isPending, startTransition] = useTransition();

    const { chartStartDate, chartEndDate } = useMemo(() => {
        const chartStartDate = filterByYear
            ? new Date(selectedYear, 0, 1)
            : new Date(selectedYear, selectedMonth - 1, 1);
        const chartEndDate = filterByYear
            ? new Date(selectedYear, 11, 31)
            : new Date(selectedYear, selectedMonth, 0);

        return { chartStartDate, chartEndDate };
    }, [filterByYear, selectedMonth, selectedYear]);

    // Memoize handlers to prevent unnecessary re-renders
    const handleYearChange = useCallback(
        (year: number) => {
            startTransition(() => setSelectedYear(year));
        },
        [startTransition]
    );

    const handleMonthChange = useCallback(
        (month: number) => {
            startTransition(() => setSelectedMonth(month));
        },
        [startTransition]
    );

    const handleFilterToggle = useCallback(
        (byYear: boolean) => {
            startTransition(() => setFilterByYear(byYear));
        },
        [startTransition]
    );

    const transactionFilters = useMemo(() => {
        const dateAfter = filterByYear
            ? `${selectedYear}-01-01`
            : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

        const dateBeforeMonth = filterByYear ? 12 : selectedMonth;
        const lastDay = new Date(selectedYear, dateBeforeMonth, 0).getDate();
        const dateBefore = `${selectedYear}-${String(dateBeforeMonth).padStart(
            2,
            '0'
        )}-${String(lastDay).padStart(2, '0')}`;

        return {
            date_after: dateAfter,
            date_before: dateBefore,
            ordering: '-date',
        };
    }, [filterByYear, selectedYear, selectedMonth]);

    const { data: transactionData, isFetching: transactionsFetching } =
        useTransactionsQuery(transactionFilters);
    const transactions = transactionData?.results ?? [];
    const deferredTransactions = useDeferredValue(transactions);
    const isStale = transactions !== deferredTransactions;
    const isUpdating = transactionsFetching || isPending || isStale;

    const activeCategoryIds = useMemo(
        () => new Set(deferredTransactions.map((t) => t.category)),
        [deferredTransactions]
    );
    const filteredCategories = useMemo(
        () => categories.filter((c) => activeCategoryIds.has(c.id)),
        [categories, activeCategoryIds]
    );

    return (
        <div className='min-h-screen'>
            {/* Header */}
            <header className='bg-base-100 border-b border-base-300'>
                <div className='py-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-2xl font-bold mb-4'>
                                Dashboard
                            </h1>
                            <p className='mt-1 text-sm opacity-60'>
                                Overview of your financial portfolio
                            </p>
                        </div>
                        <div className='text-right'>
                            <p className='text-sm opacity-60'>Last Updated</p>
                            <p className='text-sm font-medium'>
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

            <div className='space-y-6 py-6'>
                <NetWorthView />
            </div>

            {/* Filters */}
            <div className='bg-base-100 border-b border-base-300'>
                <div className='py-5'>
                    <DashboardFilters
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        filterByYear={filterByYear}
                        transactionCount={deferredTransactions.length}
                        onYearChange={handleYearChange}
                        onMonthChange={handleMonthChange}
                        onFilterToggle={handleFilterToggle}
                    />
                </div>
            </div>

            {isUpdating && (
                <div className='h-1 bg-primary/30 animate-pulse w-full' />
            )}

            <main className='py-8'>
                <div className='space-y-8'>
                    {/* Balance Overview */}
                    <div className='transform transition-all duration-200 hover:scale-[1.01]'>
                        <BalanceOverview transactions={deferredTransactions} />
                    </div>
                    {/* First Row - 2 Spending Charts */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Monthly/Yearly Spending Chart */}
                        <div className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
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
                                        {deferredTransactions.length}{' '}
                                        transaction
                                        {deferredTransactions.length !== 1
                                            ? 's'
                                            : ''}
                                    </span>
                                </div>
                            </div>
                            <div className='p-6'>
                                <MonthlySpendingChart
                                    transactions={deferredTransactions}
                                    year={selectedYear}
                                    startDate={chartStartDate}
                                    endDate={chartEndDate}
                                />
                            </div>
                        </div>

                        {/* Spending by Category */}
                        <div className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
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
                                    transactions={deferredTransactions}
                                    categories={filteredCategories}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Second Row - Investments and Heritage (Full Width) */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Investments Chart */}
                        <div className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
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
                                <InvestmentsChart
                                    investments={investments}
                                    startDate={chartStartDate}
                                    endDate={chartEndDate}
                                />
                            </div>
                        </div>

                        {/* Heritage Chart */}
                        <div className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
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
                                <HeritageChart
                                    heritages={heritages}
                                    startDate={chartStartDate}
                                    endDate={chartEndDate}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Third Row - Retirement (Full Width) */}
                    <div className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
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
                                startDate={chartStartDate}
                                endDate={chartEndDate}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
