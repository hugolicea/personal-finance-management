import { useEffect, useMemo, useState } from 'react';

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import Paginator from '../components/Paginator';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';

const columnHelper = createColumnHelper<Transaction>();

// Module-level constant
const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

function Reports() {
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.categories);
    const { transactions } = useAppSelector((state) => state.transactions);

    // Lazy init — new Date() is called only on first render
    const [selectedYear, setSelectedYear] = useState<string>(() =>
        String(new Date().getFullYear())
    );
    const [selectedMonth, setSelectedMonth] = useState<string>(() =>
        String(new Date().getMonth() + 1)
    );
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedType, setSelectedType] = useState<
        'all' | 'income' | 'expense'
    >('all');

    // Fetch categories once on mount
    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Re-fetch transactions from the backend whenever year/month/category change.
    // Type (income/expense) is kept client-side so the summary cards always reflect
    // the full period/category totals regardless of the table type filter.
    useEffect(() => {
        let dateAfter: string | undefined;
        let dateBefore: string | undefined;

        if (selectedYear !== 'all') {
            const y = Number(selectedYear);
            if (selectedMonth === 'all') {
                dateAfter = `${y}-01-01`;
                dateBefore = `${y}-12-31`;
            } else {
                const m = Number(selectedMonth);
                const lastDay = new Date(y, m, 0).getDate();
                dateAfter = `${y}-${String(m).padStart(2, '0')}-01`;
                dateBefore = `${y}-${String(m).padStart(2, '0')}-${String(
                    lastDay
                ).padStart(2, '0')}`;
            }
        }

        dispatch(
            fetchTransactions({
                category: selectedCategory || undefined,
                date_after: dateAfter,
                date_before: dateBefore,
                ordering: '-date',
            })
        );
    }, [dispatch, selectedYear, selectedMonth, selectedCategory]);

    // Static year range — no longer derived from loaded transactions
    const availableYears = useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: 8 }, (_, i) => current - i);
    }, []);

    // Type filter applied client-side on the already server-filtered dataset.
    // Only affects the table — summary cards intentionally show full period totals.
    const tableTransactions = useMemo(() => {
        if (selectedType === 'all') return transactions;
        if (selectedType === 'income')
            return transactions.filter((t) => t.amount > 0);
        return transactions.filter((t) => t.amount < 0);
    }, [transactions, selectedType]);

    // Summary totals — computed from all server-filtered transactions (ignores type)
    const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        for (const t of transactions) {
            if (t.amount > 0) income += t.amount;
            else expenses += Math.abs(t.amount);
        }
        return {
            totalIncome: income,
            totalExpenses: expenses,
            netBalance: income - expenses,
        };
    }, [transactions]);

    // Budget for the selected category filter (or sum of all categories)
    const budgetTotal = useMemo(() => {
        if (selectedCategory !== '') {
            const cat = categories.find(
                (c) => c.id === Number(selectedCategory)
            );
            return cat?.monthly_budget ?? 0;
        }
        return categories.reduce((sum, c) => sum + (c.monthly_budget ?? 0), 0);
    }, [categories, selectedCategory]);

    const budgetRemaining = budgetTotal - totalExpenses + totalIncome;

    // lookup map — build once per categories change, not per rendered row
    const catMap = useMemo(
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories]
    );

    const columns = useMemo(
        () => [
            columnHelper.accessor('date', {
                header: 'Date',
                cell: (info) =>
                    new Date(info.getValue()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    }),
                sortingFn: 'datetime',
            }),
            columnHelper.accessor('description', {
                header: 'Description',
                cell: (info) => (
                    <span
                        className='max-w-xs truncate block'
                        title={info.getValue()}
                    >
                        {info.getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('category', {
                header: 'Category',
                cell: (info) => catMap.get(info.getValue()) ?? '—',
            }),
            columnHelper.accessor('account_name', {
                header: 'Account',
                cell: (info) => info.getValue() ?? '—',
            }),
            columnHelper.accessor('amount', {
                header: 'Amount',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span
                            className={
                                val >= 0
                                    ? 'text-green-600 font-medium'
                                    : 'text-red-600 font-medium'
                            }
                        >
                            {formatCurrency(val)}
                        </span>
                    );
                },
            }),
        ],
        [catMap]
    );

    const table = useReactTable({
        data: tableTransactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: { pageSize: 20 },
            sorting: [{ id: 'date', desc: true }],
        },
    });

    return (
        <div className='space-y-6'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                    Transaction Report
                </h1>

                {/* Filters */}
                <div className='bg-white shadow rounded-lg p-4 mb-6'>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                        <div>
                            <label className='block text-xs font-medium text-gray-500 mb-1'>
                                Year
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    table.setPageIndex(0);
                                }}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='all'>All Years</option>
                                {availableYears.map((y) => (
                                    <option key={y} value={String(y)}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-xs font-medium text-gray-500 mb-1'>
                                Month
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    table.setPageIndex(0);
                                }}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='all'>All Months</option>
                                {MONTHS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-xs font-medium text-gray-500 mb-1'>
                                Category
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    table.setPageIndex(0);
                                }}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value=''>All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-xs font-medium text-gray-500 mb-1'>
                                Type
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(
                                        e.target.value as
                                            | 'all'
                                            | 'income'
                                            | 'expense'
                                    );
                                    table.setPageIndex(0);
                                }}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='all'>
                                    Income &amp; Expenses
                                </option>
                                <option value='income'>Income only</option>
                                <option value='expense'>Expenses only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary totals */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                    <div className='bg-white shadow rounded-lg p-4 flex items-center gap-4'>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                budgetRemaining >= 0
                                    ? 'bg-purple-100'
                                    : 'bg-red-100'
                            }`}
                            aria-hidden='true'
                        >
                            {budgetRemaining >= 0 ? '🎯' : '⚠️'}
                        </div>
                        <div>
                            <p className='text-xs text-gray-500'>
                                Budget remaining
                            </p>
                            <p
                                className={`text-lg font-bold ${
                                    budgetRemaining >= 0
                                        ? 'text-purple-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {formatCurrency(budgetRemaining)}
                            </p>
                            <p className='text-xs text-gray-400'>
                                of {formatCurrency(budgetTotal)}
                            </p>
                        </div>
                    </div>
                    <div className='bg-white shadow rounded-lg p-4 flex items-center gap-4'>
                        <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl'>
                            💰
                        </div>
                        <div>
                            <p className='text-xs text-gray-500'>Income</p>
                            <p className='text-lg font-bold text-green-600'>
                                {formatCurrency(totalIncome)}
                            </p>
                        </div>
                    </div>
                    <div className='bg-white shadow rounded-lg p-4 flex items-center gap-4'>
                        <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl'>
                            💸
                        </div>
                        <div>
                            <p className='text-xs text-gray-500'>Expenses</p>
                            <p className='text-lg font-bold text-red-600'>
                                {formatCurrency(totalExpenses)}
                            </p>
                        </div>
                    </div>
                    <div className='bg-white shadow rounded-lg p-4 flex items-center gap-4'>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                netBalance >= 0
                                    ? 'bg-blue-100'
                                    : 'bg-orange-100'
                            }`}
                        >
                            {netBalance >= 0 ? '📈' : '📉'}
                        </div>
                        <div>
                            <p className='text-xs text-gray-500'>
                                Net ({transactions.length} transactions)
                            </p>
                            <p
                                className={`text-lg font-bold ${
                                    netBalance >= 0
                                        ? 'text-blue-600'
                                        : 'text-orange-600'
                                }`}
                            >
                                {formatCurrency(netBalance)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transactions table */}
                <div className='bg-white shadow rounded-lg overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-50'>
                                {table.getHeaderGroups().map((headerGroup) => (
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
                                                className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100'
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
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className='px-4 py-12 text-center text-gray-400'
                                        >
                                            No transactions match the selected
                                            filters.
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className='hover:bg-gray-50'
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className='px-4 py-3 text-sm text-gray-700'
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                    <Paginator table={table} />
                </div>
            </div>
        </div>
    );
}

export default Reports;
