import { memo, useMemo } from 'react';

import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';

interface BalanceOverviewProps {
    transactions: Transaction[];
    investmentsValue?: number;
}

const BalanceOverview = memo(function BalanceOverview({
    transactions,
    investmentsValue = 0,
}: BalanceOverviewProps) {
    const { totalBalance, totalIncome, totalExpenses } = useMemo(() => {
        let balance = 0;
        let income = 0;
        let expenses = 0;
        for (const t of transactions) {
            const amount = typeof t.amount === 'number' ? t.amount : 0;
            balance += amount;
            if (amount > 0) income += amount;
            else if (amount < 0) expenses -= amount;
        }
        return {
            totalBalance: balance,
            totalIncome: income,
            totalExpenses: expenses,
        };
    }, [transactions]);

    return (
        <div className='stats stats-vertical md:stats-horizontal shadow w-full bg-base-100 rounded-2xl overflow-hidden'>
            <div className='stat'>
                <div className='stat-title'>Net Balance</div>
                <div
                    className={`stat-value text-2xl tabular-nums ${
                        totalBalance >= 0 ? 'text-success' : 'text-error'
                    }`}
                >
                    {formatCurrency(Math.abs(totalBalance))}
                </div>
                <div className='stat-desc'>
                    {totalBalance >= 0 ? '▲ surplus' : '▼ deficit'} — Current
                    Period
                </div>
            </div>

            <div className='stat'>
                <div className='stat-title'>Total Income</div>
                <div className='stat-value text-2xl text-success tabular-nums'>
                    {formatCurrency(totalIncome)}
                </div>
                <div className='stat-desc'>Current Period</div>
            </div>

            <div className='stat'>
                <div className='stat-title'>Total Expenses</div>
                <div className='stat-value text-2xl text-error tabular-nums'>
                    {formatCurrency(totalExpenses)}
                </div>
                <div className='stat-desc'>Current Period</div>
            </div>

            <div className='stat'>
                <div className='stat-title'>Savings Rate</div>
                <div
                    className={`stat-value text-2xl tabular-nums ${
                        totalIncome === 0
                            ? 'text-base-content'
                            : totalIncome - totalExpenses >= 0
                              ? 'text-success'
                              : 'text-error'
                    }`}
                >
                    {totalIncome > 0
                        ? (
                              ((totalIncome - Math.abs(totalExpenses)) /
                                  totalIncome) *
                              100
                          ).toFixed(1) + '%'
                        : '0%'}
                </div>
                <div className='stat-desc'>Current Period</div>
            </div>

            <div className='stat'>
                <div className='stat-title'>Investments Value</div>
                <div className='stat-value text-2xl tabular-nums'>
                    {formatCurrency(investmentsValue)}
                </div>
                <div className='stat-desc'>Portfolio Total</div>
            </div>
        </div>
    );
});

export default BalanceOverview;
