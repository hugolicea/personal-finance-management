import { useMemo } from 'react';

import type { Category } from '../types/categories';
import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';

interface RecentTransactionsListProps {
    transactions: Transaction[];
    categories?: Category[];
    maxItems?: number;
}

function formatShortDate(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function RecentTransactionsList({
    transactions,
    categories = [],
    maxItems = 8,
}: RecentTransactionsListProps) {
    const categoryMap = useMemo(
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories]
    );

    const displayTransactions = useMemo(
        () => transactions.slice(0, maxItems),
        [transactions, maxItems]
    );

    return (
        <section className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
            <div className='bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 rounded-t-2xl'>
                <div className='flex items-center gap-3'>
                    <span className='text-2xl'>🧾</span>
                    <div>
                        <p className='text-xs text-white/80 font-medium'>
                            Overview
                        </p>
                        <h2 className='text-lg font-semibold text-white'>
                            Recent Transactions
                        </h2>
                    </div>
                </div>
            </div>

            <div className='card-body p-0'>
                {displayTransactions.length === 0 ? (
                    <p className='text-center text-base-content/50 py-10 text-sm'>
                        No recent transactions
                    </p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='table table-zebra w-full'>
                            <thead>
                                <tr>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider'>
                                        Date
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider'>
                                        Description
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider'>
                                        Category
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-medium text-base-content/60 uppercase tracking-wider'>
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayTransactions.map((t) => (
                                    <tr key={t.id}>
                                        <td className='px-4 py-3 text-sm text-base-content/70 whitespace-nowrap'>
                                            {formatShortDate(t.date)}
                                        </td>
                                        <td className='px-4 py-3 text-sm text-base-content max-w-[180px]'>
                                            <span
                                                className='block truncate'
                                                title={t.description}
                                            >
                                                {t.description}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='badge badge-neutral badge-sm whitespace-nowrap'>
                                                {categoryMap.get(t.category) ??
                                                    'Uncategorized'}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-sm text-right font-medium tabular-nums whitespace-nowrap ${
                                                t.amount < 0
                                                    ? 'text-error'
                                                    : 'text-success'
                                            }`}
                                        >
                                            {t.amount < 0
                                                ? `-${formatCurrency(t.amount)}`
                                                : formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

export default RecentTransactionsList;
