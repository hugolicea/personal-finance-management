import { useEffect, useMemo, useState } from 'react';

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

import Paginator from '../components/Paginator';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchCategories,
    fetchCategorySpending,
} from '../store/slices/categoriesSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import { Category } from '../types/categories';
import { formatCurrency } from '../utils/formatters';

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
}

const EMPTY_STATS: CategoryStats = {
    count: 0,
    spendCount: 0,
    incomeCount: 0,
    totalSpends: 0,
    totalIncomes: 0,
    total: 0,
    average: 0,
};

function Balance() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const { transactions } = useAppSelector((state) => state.transactions);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions({}));
        dispatch(
            fetchCategorySpending(
                `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`
            )
        );
    }, [dispatch, selectedYear, selectedMonth]);

    // Build a per-category stats map in a single pass over transactions
    const categoryStatsMap = useMemo(() => {
        const map = new Map<number, CategoryStats>();
        for (const cat of categories) {
            map.set(cat.id, { ...EMPTY_STATS });
        }
        for (const t of transactions) {
            const tDate = new Date(t.date);
            if (
                tDate.getFullYear() !== selectedYear ||
                tDate.getMonth() + 1 !== selectedMonth
            )
                continue;
            const stats = map.get(t.category);
            if (!stats) continue;
            stats.count++;
            if (t.amount < 0) {
                stats.spendCount++;
                stats.totalSpends += t.amount;
            } else {
                stats.incomeCount++;
                stats.totalIncomes += t.amount;
            }
            stats.total = stats.totalSpends + stats.totalIncomes;
            stats.average = stats.count > 0 ? stats.total / stats.count : 0;
        }
        return map;
    }, [transactions, categories, selectedYear, selectedMonth]);

    // Separate categories into spends and incomes
    const spendCategories = useMemo(
        () =>
            categories.filter(
                (c) => (categoryStatsMap.get(c.id)?.spendCount ?? 0) > 0
            ),
        [categories, categoryStatsMap]
    );

    const incomeCategories = useMemo(
        () =>
            categories.filter(
                (c) => (categoryStatsMap.get(c.id)?.incomeCount ?? 0) > 0
            ),
        [categories, categoryStatsMap]
    );

    // Prepare table data for spends and incomes separately
    const spendTableData = useMemo(
        () =>
            spendCategories.map((c) => ({
                ...c,
                stats: categoryStatsMap.get(c.id) ?? EMPTY_STATS,
            })),
        [spendCategories, categoryStatsMap]
    );

    const spendTotalAmount = useMemo(
        () =>
            spendTableData.reduce(
                (sum, c) => sum + Math.abs(c.stats.totalSpends),
                0
            ),
        [spendTableData]
    );

    const incomeTableData = useMemo(
        () =>
            incomeCategories.map((c) => ({
                ...c,
                stats: categoryStatsMap.get(c.id) ?? EMPTY_STATS,
            })),
        [incomeCategories, categoryStatsMap]
    );

    const incomeTotalAmount = useMemo(
        () => incomeTableData.reduce((sum, c) => sum + c.stats.totalIncomes, 0),
        [incomeTableData]
    );

    // Define columns for spends table
    const spendColumns = useMemo<ColumnDef<TableCategory>[]>(
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
                id: 'transactions',
                header: 'Transactions',
                accessorFn: (row) => row.stats.spendCount,
                cell: ({ row }) => (
                    <div className='text-sm text-gray-900'>
                        {row.original.stats.spendCount}
                    </div>
                ),
            },
            {
                id: 'totalAmount',
                header: 'Total Amount',
                accessorFn: (row) => Math.abs(row.stats.totalSpends),
                cell: ({ row }) => {
                    const amount = Math.abs(row.original.stats.totalSpends);
                    return (
                        <div className='text-sm font-semibold text-red-600'>
                            {formatCurrency(amount)}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'monthly_budget',
                header: 'Budget',
                cell: ({ row }) => {
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
                accessorFn: (row) => {
                    const budget = row.monthly_budget
                        ? parseFloat(String(row.monthly_budget))
                        : 0;
                    return budget + row.stats.totalSpends;
                },
                cell: ({ row }) => {
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
            },
        ],
        []
    );

    // Define columns for incomes table
    const incomeColumns = useMemo<ColumnDef<TableCategory>[]>(
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
                id: 'transactions',
                header: 'Transactions',
                accessorFn: (row) => row.stats.incomeCount,
                cell: ({ row }) => (
                    <div className='text-sm text-gray-900'>
                        {row.original.stats.incomeCount}
                    </div>
                ),
            },
            {
                id: 'totalAmount',
                header: 'Total Amount',
                accessorFn: (row) => row.stats.totalIncomes,
                cell: ({ row }) => {
                    const amount = row.original.stats.totalIncomes;
                    return (
                        <div className='text-sm font-semibold text-green-600'>
                            {formatCurrency(amount)}
                        </div>
                    );
                },
            },
        ],
        []
    );

    // Create table instances for spends and incomes
    const [spendSorting, setSpendSorting] = useState<SortingState>([
        { id: 'totalAmount', desc: true },
    ]);
    const [spendColumnFilters, setSpendColumnFilters] =
        useState<ColumnFiltersState>([]);

    const spendTable = useReactTable({
        data: spendTableData,
        columns: spendColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSpendSorting,
        onColumnFiltersChange: setSpendColumnFilters,
        state: {
            sorting: spendSorting,
            columnFilters: spendColumnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const [incomeSorting, setIncomeSorting] = useState<SortingState>([
        { id: 'totalAmount', desc: true },
    ]);
    const [incomeColumnFilters, setIncomeColumnFilters] =
        useState<ColumnFiltersState>([]);

    const incomeTable = useReactTable({
        data: incomeTableData,
        columns: incomeColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setIncomeSorting,
        onColumnFiltersChange: setIncomeColumnFilters,
        state: {
            sorting: incomeSorting,
            columnFilters: incomeColumnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className='pb-6'>
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
                    </div>

                    <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                        {/* Spends Table */}
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center'>
                                        <span
                                            aria-hidden='true'
                                            className='text-lg font-medium text-red-900'
                                        >
                                            💸
                                        </span>
                                        <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                            Spending Categories
                                        </h3>
                                    </div>
                                    <div className='text-right'>
                                        <div className='text-sm text-gray-600'>
                                            Total
                                        </div>
                                        <div className='text-lg font-semibold text-red-600'>
                                            {formatCurrency(spendTotalAmount)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Global Search for Spends */}
                            <div className='px-6 py-4 border-b border-gray-200'>
                                <div className='flex gap-4'>
                                    <div className='flex-1'>
                                        <input
                                            type='text'
                                            placeholder='Search spending categories...'
                                            value={
                                                spendTable.getState()
                                                    .globalFilter ?? ''
                                            }
                                            onChange={(event) =>
                                                spendTable.setGlobalFilter(
                                                    event.target.value
                                                )
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='overflow-x-auto'>
                                <table className='w-full table-auto divide-y divide-gray-200'>
                                    <thead className='bg-gray-50'>
                                        {spendTable
                                            .getHeaderGroups()
                                            .map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map(
                                                        (header) => (
                                                            <th
                                                                key={header.id}
                                                                scope='col'
                                                                aria-sort={
                                                                    header.column.getIsSorted() ===
                                                                    'asc'
                                                                        ? 'ascending'
                                                                        : header.column.getIsSorted() ===
                                                                            'desc'
                                                                          ? 'descending'
                                                                          : 'none'
                                                                }
                                                                className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
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
                                                                {header.column.getIsSorted() && (
                                                                    <span aria-hidden='true'>
                                                                        {header.column.getIsSorted() ===
                                                                        'asc'
                                                                            ? ' 🔼'
                                                                            : ' 🔽'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                        {spendTable
                                            .getRowModel()
                                            .rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className='hover:bg-gray-50'
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => (
                                                            <td
                                                                key={cell.id}
                                                                className='px-4 py-2 text-sm text-gray-900'
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

                            <Paginator table={spendTable} />
                        </div>

                        {/* Incomes Table */}
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-green-50 border-b border-green-200'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center'>
                                        <span
                                            aria-hidden='true'
                                            className='text-lg font-medium text-green-700'
                                        >
                                            💰
                                        </span>
                                        <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                            Income Categories
                                        </h3>
                                    </div>
                                    <div className='text-right'>
                                        <div className='text-sm text-gray-600'>
                                            Total
                                        </div>
                                        <div className='text-lg font-semibold text-green-600'>
                                            {formatCurrency(incomeTotalAmount)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Global Search for Incomes */}
                            <div className='px-6 py-4 border-b border-gray-200'>
                                <div className='flex gap-4'>
                                    <div className='flex-1'>
                                        <input
                                            type='text'
                                            placeholder='Search income categories...'
                                            value={
                                                incomeTable.getState()
                                                    .globalFilter ?? ''
                                            }
                                            onChange={(event) =>
                                                incomeTable.setGlobalFilter(
                                                    event.target.value
                                                )
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='overflow-x-auto'>
                                <table className='w-full table-auto divide-y divide-gray-200'>
                                    <thead className='bg-gray-50'>
                                        {incomeTable
                                            .getHeaderGroups()
                                            .map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map(
                                                        (header) => (
                                                            <th
                                                                key={header.id}
                                                                scope='col'
                                                                aria-sort={
                                                                    header.column.getIsSorted() ===
                                                                    'asc'
                                                                        ? 'ascending'
                                                                        : header.column.getIsSorted() ===
                                                                            'desc'
                                                                          ? 'descending'
                                                                          : 'none'
                                                                }
                                                                className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
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
                                                                {header.column.getIsSorted() && (
                                                                    <span aria-hidden='true'>
                                                                        {header.column.getIsSorted() ===
                                                                        'asc'
                                                                            ? ' 🔼'
                                                                            : ' 🔽'}
                                                                    </span>
                                                                )}
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                        {incomeTable
                                            .getRowModel()
                                            .rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className='hover:bg-gray-50'
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => (
                                                            <td
                                                                key={cell.id}
                                                                className='px-4 py-2 text-sm text-gray-900'
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

                            <Paginator table={incomeTable} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Balance;
