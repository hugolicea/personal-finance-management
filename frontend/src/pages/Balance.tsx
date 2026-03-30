import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import Modal from '../components/Modal';
import Paginator from '../components/Paginator';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchCategories,
    fetchCategorySpending,
} from '../store/slices/categoriesSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import { Category } from '../types/categories';
import type { Transaction } from '../types/transactions';
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

// Hoisted to module level — not recomputed on every render (vercel rendering-hoist-jsx)
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

// Column helper and column defs for the per-category transaction modal
const txColumnHelper = createColumnHelper<Transaction>();

const MODAL_COLUMNS = [
    txColumnHelper.accessor('date', {
        header: 'Date',
        cell: (info) =>
            new Date(info.getValue()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        sortingFn: 'datetime',
    }),
    txColumnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => (
            <span className='max-w-xs truncate block' title={info.getValue()}>
                {info.getValue()}
            </span>
        ),
    }),
    txColumnHelper.accessor('account_name', {
        header: 'Account',
        cell: (info) => info.getValue() ?? '—',
    }),
    txColumnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
            const val = info.getValue();
            return (
                <span
                    className={
                        val >= 0
                            ? 'text-success font-medium tabular-nums'
                            : 'text-error font-medium tabular-nums'
                    }
                >
                    {formatCurrency(val)}
                </span>
            );
        },
    }),
];

function Balance() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const { transactions } = useAppSelector((state) => state.transactions);

    // Lazy init — new Date() called only once on mount (vercel rerender-lazy-state-init)
    const [selectedYear, setSelectedYear] = useState(() =>
        new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        () => new Date().getMonth() + 1
    );
    const [filtersOpen, setFiltersOpen] = useState(true);

    const activeFilterCount = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        return [
            selectedYear !== currentYear,
            selectedMonth !== currentMonth,
        ].filter(Boolean).length;
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const dateAfter = `${selectedYear}-${String(selectedMonth).padStart(
            2,
            '0'
        )}-01`;
        const dateBefore = `${selectedYear}-${String(selectedMonth).padStart(
            2,
            '0'
        )}-${String(lastDay).padStart(2, '0')}`;

        dispatch(fetchCategories());
        dispatch(
            fetchTransactions({
                date_after: dateAfter,
                date_before: dateBefore,
            })
        );
        dispatch(
            fetchCategorySpending(
                `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
            )
        );
    }, [dispatch, selectedYear, selectedMonth]);

    // Build a per-category stats map in a single pass over transactions.
    // The backend already filters to the selected month via date_after/date_before.
    const categoryStatsMap = useMemo(() => {
        const map = new Map<number, CategoryStats>();
        for (const cat of categories) {
            map.set(cat.id, { ...EMPTY_STATS });
        }
        for (const t of transactions) {
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
    }, [transactions, categories]);

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

    const spendTotalBudget = useMemo(
        () =>
            spendTableData.reduce(
                (sum, c) =>
                    sum +
                    (c.monthly_budget
                        ? parseFloat(String(c.monthly_budget))
                        : 0),
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

    // Modal state — which category's transactions to show
    const [modalCategory, setModalCategory] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const handleOpenModal = useCallback((id: number, name: string) => {
        setModalCategory({ id, name });
    }, []);

    // Filter already-loaded transactions for the modal category
    const modalTransactions = useMemo(
        () =>
            modalCategory
                ? transactions.filter((t) => t.category === modalCategory.id)
                : [],
        [transactions, modalCategory]
    );

    const modalTable = useReactTable({
        data: modalTransactions,
        columns: MODAL_COLUMNS,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: { pageSize: 20 },
            sorting: [{ id: 'date', desc: true }],
        },
    });

    // Define columns for spends table
    const spendColumns = useMemo<ColumnDef<TableCategory>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Category',
                cell: ({ getValue }) => (
                    <div className='text-sm font-medium'>
                        {getValue<string>()}
                    </div>
                ),
            },
            {
                id: 'transactions',
                header: 'Transactions',
                accessorFn: (row) => row.stats.spendCount,
                cell: ({ row }) => (
                    <button
                        onClick={() =>
                            handleOpenModal(row.original.id, row.original.name)
                        }
                        className='text-sm font-medium text-primary hover:underline'
                        aria-label={`View ${row.original.stats.spendCount} transactions for ${row.original.name}`}
                    >
                        {row.original.stats.spendCount}
                    </button>
                ),
            },
            {
                id: 'budgetUsage',
                header: 'Budget Usage',
                accessorFn: (row) => Math.abs(row.stats.totalSpends),
                cell: ({ row }) => {
                    const spent = Math.abs(row.original.stats.totalSpends);
                    const budget = row.original.monthly_budget
                        ? parseFloat(String(row.original.monthly_budget))
                        : 0;

                    if (budget === 0) {
                        return (
                            <div>
                                <div className='text-sm font-semibold text-error tabular-nums'>
                                    {formatCurrency(spent)}
                                </div>
                                <div className='text-xs text-gray-400 mt-0.5'>
                                    No budget set
                                </div>
                            </div>
                        );
                    }

                    const pct = Math.min((spent / budget) * 100, 100);
                    const isOver = spent > budget;
                    const isWarn = !isOver && pct >= 75;
                    const barColor = isOver
                        ? 'bg-red-500'
                        : isWarn
                          ? 'bg-yellow-500'
                          : 'bg-green-500';
                    const trackColor = isOver
                        ? 'bg-red-100'
                        : isWarn
                          ? 'bg-yellow-100'
                          : 'bg-green-100';

                    return (
                        <div className='min-w-[160px]'>
                            <div className='flex justify-between text-xs mb-1'>
                                <span className='font-semibold text-error tabular-nums'>
                                    {formatCurrency(spent)}
                                </span>
                                <span className='text-gray-400 tabular-nums'>
                                    of {formatCurrency(budget)}
                                </span>
                            </div>
                            {/* Accessible progress bar — WCAG 1.4.1: color + text label */}
                            <div
                                className={`w-full h-2 rounded-full ${trackColor}`}
                                role='progressbar'
                                aria-valuenow={Math.round(pct)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${Math.round(
                                    pct
                                )}% of budget used`}
                            >
                                <div
                                    className={`h-2 rounded-full ${barColor} transition-[width] duration-300`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div
                                className={`text-xs mt-1 tabular-nums ${
                                    isOver
                                        ? 'text-error font-semibold'
                                        : 'text-gray-400'
                                }`}
                            >
                                {isOver
                                    ? `${formatCurrency(
                                          spent - budget
                                      )} over budget`
                                    : `${Math.round(pct)}% used`}
                            </div>
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
                            className={`text-sm font-semibold tabular-nums ${
                                remaining >= 0 ? 'text-success' : 'text-error'
                            }`}
                        >
                            {formatCurrency(remaining)}
                        </span>
                    );
                },
            },
        ],
        [handleOpenModal]
    );

    // Define columns for incomes table
    const incomeColumns = useMemo<ColumnDef<TableCategory>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Category',
                cell: ({ getValue }) => (
                    <div className='text-sm font-medium'>
                        {getValue<string>()}
                    </div>
                ),
            },
            {
                id: 'transactions',
                header: 'Transactions',
                accessorFn: (row) => row.stats.incomeCount,
                cell: ({ row }) => (
                    <button
                        onClick={() =>
                            handleOpenModal(row.original.id, row.original.name)
                        }
                        className='text-sm font-medium text-primary hover:underline'
                        aria-label={`View ${row.original.stats.incomeCount} transactions for ${row.original.name}`}
                    >
                        {row.original.stats.incomeCount}
                    </button>
                ),
            },
            {
                id: 'totalAmount',
                header: 'Total Amount',
                accessorFn: (row) => row.stats.totalIncomes,
                cell: ({ row }) => {
                    const amount = row.original.stats.totalIncomes;
                    return (
                        <div className='text-sm font-semibold text-success tabular-nums'>
                            {formatCurrency(amount)}
                        </div>
                    );
                },
            },
        ],
        [handleOpenModal]
    );

    // Create table instances for spends and incomes
    const [spendSorting, setSpendSorting] = useState<SortingState>([
        { id: 'budgetUsage', desc: true },
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
        <div className='space-y-6'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold mb-8'>Balance Analysis</h1>

                {/* Period Selection */}
                <div className='card bg-base-100 shadow-sm mb-6'>
                    <div className='card-body p-3'>
                        <div className='flex items-center justify-between'>
                            <button
                                type='button'
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className='flex items-center gap-2 btn btn-ghost btn-sm px-2'
                                aria-expanded={filtersOpen}
                                aria-controls='balance-filter-panel'
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform ${
                                        filtersOpen ? 'rotate-180' : ''
                                    }`}
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                                <span className='font-medium text-sm'>
                                    Filters
                                </span>
                                {activeFilterCount > 0 && (
                                    <span className='badge badge-primary badge-sm'>
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {filtersOpen && (
                            <div
                                id='balance-filter-panel'
                                className='flex flex-wrap gap-4 pt-2 border-t border-base-200'
                            >
                                <label
                                    htmlFor='year-select'
                                    className='text-sm font-medium self-center'
                                >
                                    Year:
                                </label>
                                <select
                                    id='year-select'
                                    value={selectedYear}
                                    onChange={(e) =>
                                        setSelectedYear(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className='select select-bordered select-sm'
                                >
                                    {YEAR_OPTIONS.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>

                                <label
                                    htmlFor='month-select'
                                    className='text-sm font-medium self-center'
                                >
                                    Month:
                                </label>
                                <select
                                    id='month-select'
                                    value={selectedMonth}
                                    onChange={(e) =>
                                        setSelectedMonth(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className='select select-bordered select-sm'
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
                        )}
                    </div>
                </div>

                <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    {/* Spends Table */}
                    <div className='card bg-base-100 shadow-sm overflow-hidden'>
                        <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center'>
                                    <span
                                        aria-hidden='true'
                                        className='text-lg font-medium text-red-900'
                                    >
                                        💸
                                    </span>
                                    <h3 className='ml-3 text-lg font-medium'>
                                        Spending Categories
                                    </h3>
                                </div>
                                <div className='text-right'>
                                    <div className='text-lg font-semibold text-error tabular-nums'>
                                        {formatCurrency(spendTotalAmount)}
                                    </div>
                                    <div className='text-xs text-gray-400 mt-0.5 tabular-nums'>
                                        of {formatCurrency(spendTotalBudget)}{' '}
                                        budget
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Global Search for Spends */}
                        <div className='px-6 py-4 border-b border-base-300'>
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
                                        className='input input-bordered w-full'
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='table table-zebra w-full'>
                                <thead className='sticky top-0 bg-base-100 z-10 shadow-sm'>
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
                                                            className='px-4 py-2 text-left text-xs font-medium opacity-60 uppercase cursor-pointer hover:bg-gray-100'
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
                                <tbody>
                                    {spendTable
                                        .getRowModel()
                                        .rows.map((row) => (
                                            <tr key={row.id} className=''>
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
                    <div className='card bg-base-100 shadow-sm overflow-hidden'>
                        <div className='px-6 py-4 bg-green-50 border-b border-green-200'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center'>
                                    <span
                                        aria-hidden='true'
                                        className='text-lg font-medium text-green-700'
                                    >
                                        💰
                                    </span>
                                    <h3 className='ml-3 text-lg font-medium'>
                                        Income Categories
                                    </h3>
                                </div>
                                <div className='text-right'>
                                    <div className='text-sm text-gray-600'>
                                        Total
                                    </div>
                                    <div className='text-lg font-semibold text-success tabular-nums'>
                                        {formatCurrency(incomeTotalAmount)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Global Search for Incomes */}
                        <div className='px-6 py-4 border-b border-base-300'>
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
                                        className='input input-bordered w-full'
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='table table-zebra w-full'>
                                <thead className='sticky top-0 bg-base-100 z-10 shadow-sm'>
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
                                                            className='px-4 py-2 text-left text-xs font-medium opacity-60 uppercase cursor-pointer hover:bg-gray-100'
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
                                <tbody>
                                    {incomeTable
                                        .getRowModel()
                                        .rows.map((row) => (
                                            <tr key={row.id} className=''>
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

            {/* Per-category transaction modal */}
            <Modal
                isOpen={modalCategory !== null}
                onClose={() => setModalCategory(null)}
                title={`${modalCategory?.name ?? ''} — Transactions`}
                maxWidth='max-w-5xl'
            >
                <div className='overflow-x-auto'>
                    <table className='table table-zebra w-full'>
                        <thead className='sticky top-0 bg-base-100 z-10 shadow-sm'>
                            {modalTable.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            scope='col'
                                            onClick={header.column.getToggleSortingHandler()}
                                            aria-sort={
                                                header.column.getIsSorted() ===
                                                'asc'
                                                    ? 'ascending'
                                                    : header.column.getIsSorted() ===
                                                        'desc'
                                                      ? 'descending'
                                                      : 'none'
                                            }
                                            className='px-4 py-3 text-left text-xs font-medium opacity-60 uppercase cursor-pointer select-none hover:bg-gray-100'
                                        >
                                            <div className='flex items-center gap-1'>
                                                {
                                                    header.column.columnDef
                                                        .header as string
                                                }
                                                {header.column.getIsSorted() ===
                                                    'asc' && ' ↑'}
                                                {header.column.getIsSorted() ===
                                                    'desc' && ' ↓'}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {modalTable.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className='px-4 py-12 text-center text-gray-400'
                                    >
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                modalTable.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className=''>
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className='px-4 py-3 text-sm opacity-70'
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Paginator table={modalTable} />
            </Modal>
        </div>
    );
}

export default Balance;
