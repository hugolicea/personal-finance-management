import { useState } from 'react';

import { Link } from 'react-router-dom';

import { useSpendingSummaryQuery } from '../hooks/queries/useSpendingSummaryQuery';
import type { SpendingSummaryItem } from '../types/categories';
import { formatCurrency } from '../utils/formatters';

function formatMonthLabel(month: string): string {
    if (!month) {
        return new Date().toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }

    const [yearText, monthText] = month.split('-');
    const year = Number(yearText);
    const monthNumber = Number(monthText);

    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
        return month;
    }

    return new Date(year, monthNumber - 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

function getProgressColors(percentage: number) {
    if (percentage > 100) {
        return {
            trackClass: 'bg-error/20',
            fillClass: 'bg-error',
        };
    }

    if (percentage >= 75) {
        return {
            trackClass: 'bg-warning/20',
            fillClass: 'bg-warning',
        };
    }

    return {
        trackClass: 'bg-success/20',
        fillClass: 'bg-success',
    };
}

function BudgetProgressSkeleton() {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
            {Array.from({ length: 8 }, (_, index) => (
                <div
                    key={index}
                    className='card bg-base-100 shadow-sm border border-base-200 p-3 flex flex-col gap-2'
                >
                    <div className='h-6 bg-base-300 rounded-md motion-safe:animate-pulse' />
                    <div className='h-6 bg-base-300 rounded-md motion-safe:animate-pulse' />
                    <div className='h-4 bg-base-300 rounded-md motion-safe:animate-pulse w-2/3' />
                    <div className='h-2 bg-base-300 rounded-full motion-safe:animate-pulse mt-2' />
                    <div className='h-4 bg-base-300 rounded-md motion-safe:animate-pulse mt-2' />
                </div>
            ))}
        </div>
    );
}

function BudgetCard({ category }: { category: SpendingSummaryItem }) {
    const spent = category.total_spent;
    const budget = category.budget_limit;
    const hasBudget = budget > 0;
    const percentage = hasBudget ? category.percentage_used ?? 0 : 0;
    const isOverBudget = hasBudget && spent > budget;

    const { trackClass, fillClass } = getProgressColors(percentage);
    const progressTrackClass = hasBudget ? trackClass : 'bg-base-200';
    const progressWidth = hasBudget ? `${Math.min(percentage, 100)}%` : '0%';

    const remaining = budget - spent;

    return (
        <article
            className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-300 p-3 flex flex-col gap-1 ${
                isOverBudget ? 'border-l-4 border-l-error' : ''
            }`}
        >
            <div className='flex justify-between items-start mb-1'>
                <h3 className='text-sm font-semibold text-base-content truncate pr-2'>
                    {category.name}
                </h3>
                {isOverBudget ? (
                    <span className='badge badge-error badge-sm font-medium motion-safe:animate-pulse'>
                        Over Budget
                    </span>
                ) : null}
            </div>

            <div className='flex items-baseline justify-between mb-2'>
                <p
                    className={`text-xl font-bold tabular-nums ${
                        isOverBudget ? 'text-error' : 'text-base-content'
                    }`}
                >
                    {formatCurrency(spent)}
                </p>
                <p className='text-xs font-medium text-base-content/60 tabular-nums'>
                    of {formatCurrency(budget)}
                </p>
            </div>

            <div
                role='progressbar'
                aria-valuenow={Math.min(Math.round(percentage), 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${category.name} budget usage`}
                className={`w-full h-2 rounded-full mt-auto ${progressTrackClass}`}
            >
                {hasBudget ? (
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${fillClass}`}
                        style={{ width: progressWidth }}
                    />
                ) : null}
            </div>

            <div className='flex justify-between mt-2 text-xs font-medium text-base-content/70'>
                {hasBudget ? (
                    <>
                        <span
                            className={
                                isOverBudget
                                    ? 'text-error'
                                    : 'text-base-content/70'
                            }
                        >
                            {isOverBudget
                                ? `${formatCurrency(
                                      Math.abs(remaining)
                                  )} over budget`
                                : `${formatCurrency(remaining)} left`}
                        </span>
                        <span>{`${Math.round(percentage)}% used`}</span>
                    </>
                ) : (
                    <span className='italic text-base-content/50'>
                        No budget set
                    </span>
                )}
            </div>
        </article>
    );
}

function BudgetProgress() {
    const [selectedYear, setSelectedYear] = useState(() =>
        new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        () => new Date().getMonth() + 1
    );

    const selectedMonthStr = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        '0'
    )}`;
    const {
        data,
        isLoading,
        error: queryError,
    } = useSpendingSummaryQuery(selectedMonthStr);
    const categories = data?.categories ?? [];
    const error = queryError
        ? queryError.message ?? 'Failed to fetch spending summary'
        : null;

    const isCurrentMonth =
        selectedYear === new Date().getFullYear() &&
        selectedMonth === new Date().getMonth() + 1;

    function goToPrevMonth() {
        if (selectedMonth === 1) {
            setSelectedYear((y) => y - 1);
            setSelectedMonth(12);
        } else {
            setSelectedMonth((m) => m - 1);
        }
    }

    function goToNextMonth() {
        if (selectedMonth === 12) {
            setSelectedYear((y) => y + 1);
            setSelectedMonth(1);
        } else {
            setSelectedMonth((m) => m + 1);
        }
    }

    return (
        <div className='space-y-6'>
            <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-base-content'>
                        Budget Progress
                    </h1>
                    <p className='text-base-content/60 text-sm mt-1'>
                        Track spending against budget limits
                    </p>
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        className='btn btn-ghost btn-sm btn-square'
                        onClick={goToPrevMonth}
                        aria-label='Previous month'
                    >
                        ‹
                    </button>
                    <span className='text-base font-semibold min-w-36 text-center text-base-content'>
                        {formatMonthLabel(selectedMonthStr)}
                    </span>
                    <button
                        className='btn btn-ghost btn-sm btn-square'
                        onClick={goToNextMonth}
                        disabled={isCurrentMonth}
                        aria-label='Next month'
                    >
                        ›
                    </button>
                </div>
            </header>

            {error ? (
                <div role='alert' className='alert alert-error mb-6'>
                    <span>{error}</span>
                </div>
            ) : null}

            {isLoading ? <BudgetProgressSkeleton /> : null}

            {!isLoading && !error && categories.length === 0 ? (
                <div className='card bg-base-100 border border-base-200 shadow-sm p-12 text-center flex items-center'>
                    <div className='text-5xl mb-3' aria-hidden='true'>
                        🎯
                    </div>
                    <h2 className='text-xl font-semibold text-base-content mb-1'>
                        No spend categories with a budget
                    </h2>
                    <p className='text-base-content/60 mb-5'>
                        Add a spend category and set a monthly budget to start
                        tracking your progress here.
                    </p>
                    <Link to='/categories' className='btn btn-primary'>
                        Go to Categories
                    </Link>
                </div>
            ) : null}

            {!isLoading && !error && categories.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                    {categories.map((category) => (
                        <BudgetCard key={category.id} category={category} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export default BudgetProgress;
