import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchCategories,
    fetchCategorySpending,
} from '../store/slices/categoriesSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import { formatCurrency } from '../utils/formatters';

interface Category {
    id: number;
    name: string;
    classification: string;
    monthly_budget: string | number;
}

interface CategoryStats {
    count: number;
    spendCount: number;
    incomeCount: number;
    totalSpends: number;
    totalIncomes: number;
    total: number;
    average: number;
}

interface TableCategory extends Category {
    stats: CategoryStats;
    classification: 'spend' | 'income';
}

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
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

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
    const getCategoryStats = useCallback(
        (categoryId: number) => {
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
        },
        [transactions, selectedYear, selectedMonth]
    );

    // Separate categories into spends and incomes
    const spendCategories = useMemo(
        () =>
            categories.filter((category) => {
                const stats = getCategoryStats(category.id);
                return showOnlyWithTransactions || stats.spendCount > 0;
            }),
        [categories, getCategoryStats, showOnlyWithTransactions]
    );

    const incomeCategories = useMemo(
        () =>
            categories.filter((category) => {
                const stats = getCategoryStats(category.id);
                return showOnlyWithTransactions || stats.incomeCount > 0;
            }),
        [categories, getCategoryStats, showOnlyWithTransactions]
    );

    // Prepare table data
    const tableData = useMemo(() => {
        const spendData = spendCategories
            .filter((category) => getCategoryStats(category.id).spendCount > 0)
            .map((category) => ({
                ...category,
                stats: getCategoryStats(category.id),
                classification: 'spend' as const,
            }));

        const incomeData = incomeCategories
            .filter((category) => getCategoryStats(category.id).incomeCount > 0)
            .map((category) => ({
                ...category,
                stats: getCategoryStats(category.id),
                classification: 'income' as const,
            }));

        return [...spendData, ...incomeData];
    }, [spendCategories, incomeCategories, getCategoryStats]);

    // Define table columns
    const columns = useMemo<ColumnDef<TableCategory>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Category',
                cell: ({ getValue }) => (
                    <div className='text-sm font-medium text-gray-900'>
                        {getValue<string>()}
                    </div>
                ),
            },
            {
                accessorKey: 'classification',
                header: 'Type',
                cell: ({ getValue }) => {
                    const classification = getValue<string>();
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                classification === 'spend'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {classification === 'spend'
                                ? '💸 Spend'
                                : '💰 Income'}
                        </span>
                    );
                },
                filterFn: 'equals',
            },
            {
                id: 'transactions',
                header: 'Transactions',
                cell: ({ row }) => (
                    <div className='text-sm text-gray-900'>
                        {row.original.classification === 'spend'
                            ? row.original.stats.spendCount
                            : row.original.stats.incomeCount}
                    </div>
                ),
                sortingFn: (rowA, rowB) => {
                    const countA =
                        rowA.original.classification === 'spend'
                            ? rowA.original.stats.spendCount
                            : rowA.original.stats.incomeCount;
                    const countB =
                        rowB.original.classification === 'spend'
                            ? rowB.original.stats.spendCount
                            : rowB.original.stats.incomeCount;
                    return countA - countB;
                },
            },
            {
                id: 'totalAmount',
                header: 'Total Amount',
                cell: ({ row }) => {
                    const amount =
                        row.original.classification === 'spend'
                            ? Math.abs(row.original.stats.totalSpends)
                            : row.original.stats.totalIncomes;
                    return (
                        <div
                            className={`text-sm font-semibold ${
                                row.original.classification === 'spend'
                                    ? 'text-red-600'
                                    : 'text-green-600'
                            }`}
                        >
                            {formatCurrency(amount)}
                        </div>
                    );
                },
                sortingFn: (rowA, rowB) => {
                    const amountA =
                        rowA.original.classification === 'spend'
                            ? Math.abs(rowA.original.stats.totalSpends)
                            : rowA.original.stats.totalIncomes;
                    const amountB =
                        rowB.original.classification === 'spend'
                            ? Math.abs(rowB.original.stats.totalSpends)
                            : rowB.original.stats.totalIncomes;
                    return amountA - amountB;
                },
            },
            {
                accessorKey: 'monthly_budget',
                header: 'Budget',
                cell: ({ row }) => {
                    if (row.original.classification === 'income') {
                        return <div className='text-sm text-gray-400'>-</div>;
                    }
                    const budget = row.original.monthly_budget
                        ? parseFloat(String(row.original.monthly_budget))
                        : 0;
                    return (
                        <div className='text-sm font-semibold text-blue-600'>
                            {formatCurrency(budget)}
                        </div>
                    );
                },
            },
            {
                id: 'remaining',
                header: 'Remaining',
                cell: ({ row }) => {
                    if (row.original.classification === 'income') {
                        return <div className='text-sm text-gray-400'>-</div>;
                    }
                    const budget = row.original.monthly_budget
                        ? parseFloat(String(row.original.monthly_budget))
                        : 0;
                    const remaining = budget + row.original.stats.totalSpends;
                    return (
                        <span
                            className={`text-sm font-semibold ${
                                remaining >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            }`}
                        >
                            {formatCurrency(remaining)}
                        </span>
                    );
                },
                sortingFn: (rowA, rowB) => {
                    // Income categories don't have remaining budget, so sort them to the end
                    if (
                        rowA.original.classification === 'income' &&
                        rowB.original.classification === 'income'
                    ) {
                        return 0;
                    }
                    if (rowA.original.classification === 'income') return 1;
                    if (rowB.original.classification === 'income') return -1;

                    // Both are spend categories, compare remaining budget
                    const budgetA = rowA.original.monthly_budget
                        ? parseFloat(String(rowA.original.monthly_budget))
                        : 0;
                    const budgetB = rowB.original.monthly_budget
                        ? parseFloat(String(rowB.original.monthly_budget))
                        : 0;
                    const remainingA =
                        budgetA + rowA.original.stats.totalSpends;
                    const remainingB =
                        budgetB + rowB.original.stats.totalSpends;
                    return remainingA - remainingB;
                },
            },
        ],
        []
    );

    // Create table instance
    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
            sorting: [
                { id: 'classification', desc: false }, // spend first, then income
                { id: 'totalAmount', desc: true }, // then by amount descending
            ],
        },
    });

    // Memoized values for performance (after table creation)
    const currentColumnFilters = table.getState().columnFilters;

    const currentClassificationFilter = useMemo(
        () =>
            currentColumnFilters.find((f) => f.id === 'classification')
                ?.value || '',
        [currentColumnFilters]
    );

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

                            <div className='flex items-center space-x-2'>
                                <span className='text-sm text-gray-700'>
                                    View:
                                </span>
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        viewMode === 'card'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        viewMode === 'table'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Table
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Categories Display */}
                    {viewMode === 'card' ? (
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
                                            if (stats.spendCount === 0)
                                                return null;
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
                                                                    {formatCurrency(
                                                                        Math.abs(
                                                                            stats.totalSpends
                                                                        )
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className='flex justify-between items-center'>
                                                                <span className='text-sm text-gray-500'>
                                                                    Budget
                                                                </span>
                                                                <span className='text-lg font-semibold text-blue-600'>
                                                                    {formatCurrency(
                                                                        category.monthly_budget
                                                                            ? parseFloat(
                                                                                  String(
                                                                                      category.monthly_budget
                                                                                  )
                                                                              )
                                                                            : 0
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className='flex justify-between items-center'>
                                                                <span className='text-sm text-gray-500'>
                                                                    Remaining
                                                                    Budget
                                                                </span>
                                                                <span
                                                                    className={`text-lg font-semibold ${
                                                                        (category.monthly_budget
                                                                            ? parseFloat(
                                                                                  String(
                                                                                      category.monthly_budget
                                                                                  )
                                                                              )
                                                                            : 0) +
                                                                            stats.totalSpends >=
                                                                        0
                                                                            ? 'text-green-600'
                                                                            : 'text-red-600'
                                                                    }`}
                                                                >
                                                                    {formatCurrency(
                                                                        (category.monthly_budget
                                                                            ? parseFloat(
                                                                                  String(
                                                                                      category.monthly_budget
                                                                                  )
                                                                              )
                                                                            : 0) +
                                                                            stats.totalSpends
                                                                    )}
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
                                                                    {formatCurrency(
                                                                        stats.totalIncomes
                                                                    )}
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
                    ) : (
                        /* Table View */
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
                                <h3 className='text-lg font-medium text-gray-900'>
                                    📊 Category Analysis - {selectedYear}{' '}
                                    {new Date(
                                        0,
                                        selectedMonth - 1
                                    ).toLocaleString('default', {
                                        month: 'long',
                                    })}
                                </h3>
                            </div>

                            {/* Global Search */}
                            <div className='px-6 py-4 border-b border-gray-200'>
                                <div className='flex gap-4'>
                                    <div className='flex-1'>
                                        <input
                                            type='text'
                                            placeholder='Search categories...'
                                            value={globalFilter}
                                            onChange={(e) =>
                                                setGlobalFilter(e.target.value)
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                    <div className='flex gap-2'>
                                        <select
                                            value={currentClassificationFilter}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value) {
                                                    table
                                                        .getColumn(
                                                            'classification'
                                                        )
                                                        ?.setFilterValue(value);
                                                } else {
                                                    table
                                                        .getColumn(
                                                            'classification'
                                                        )
                                                        ?.setFilterValue(
                                                            undefined
                                                        );
                                                }
                                            }}
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        >
                                            <option value=''>All Types</option>
                                            <option value='spend'>
                                                💸 Spend
                                            </option>
                                            <option value='income'>
                                                💰 Income
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200'>
                                    <thead className='bg-gray-50'>
                                        {table
                                            .getHeaderGroups()
                                            .map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map(
                                                        (header) => (
                                                            <th
                                                                key={header.id}
                                                                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                                                                onClick={header.column.getToggleSortingHandler()}
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header
                                                                              .column
                                                                              .columnDef
                                                                              .header,
                                                                          header.getContext()
                                                                      )}
                                                                {{
                                                                    asc: ' 🔼',
                                                                    desc: ' 🔽',
                                                                }[
                                                                    header.column.getIsSorted() as string
                                                                ] ?? null}
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                        {table.getRowModel().rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className='hover:bg-gray-50'
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => (
                                                        <td
                                                            key={cell.id}
                                                            className='px-6 py-4 whitespace-nowrap'
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext()
                                                            )}
                                                        </td>
                                                    ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                    <span className='text-sm text-gray-700'>
                                        Show
                                    </span>
                                    <select
                                        value={
                                            table.getState().pagination.pageSize
                                        }
                                        onChange={(e) => {
                                            table.setPageSize(
                                                Number(e.target.value)
                                            );
                                        }}
                                        className='px-2 py-1 border border-gray-300 rounded text-sm'
                                    >
                                        {[10, 20, 30, 40, 50].map(
                                            (pageSize) => (
                                                <option
                                                    key={pageSize}
                                                    value={pageSize}
                                                >
                                                    {pageSize}
                                                </option>
                                            )
                                        )}
                                    </select>
                                    <span className='text-sm text-gray-700'>
                                        entries
                                    </span>
                                </div>

                                <div className='flex items-center space-x-2'>
                                    <span className='text-sm text-gray-700'>
                                        Page{' '}
                                        {table.getState().pagination.pageIndex +
                                            1}{' '}
                                        of {table.getPageCount()}
                                    </span>
                                    <div className='flex space-x-1'>
                                        <button
                                            onClick={() =>
                                                table.setPageIndex(0)
                                            }
                                            disabled={
                                                !table.getCanPreviousPage()
                                            }
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'<<'}
                                        </button>
                                        <button
                                            onClick={() => table.previousPage()}
                                            disabled={
                                                !table.getCanPreviousPage()
                                            }
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'<'}
                                        </button>
                                        <button
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'>'}
                                        </button>
                                        <button
                                            onClick={() =>
                                                table.setPageIndex(
                                                    table.getPageCount() - 1
                                                )
                                            }
                                            disabled={!table.getCanNextPage()}
                                            className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
                                        >
                                            {'>>'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {categoriesLoading && (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading categories...
                                </div>
                            )}
                            {!categoriesLoading && tableData.length === 0 && (
                                <div className='p-6 text-center text-gray-500'>
                                    No categories found
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Balance;
