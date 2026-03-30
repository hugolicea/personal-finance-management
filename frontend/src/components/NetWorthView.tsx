import { memo, useMemo } from 'react';

import { useAppSelector } from '../hooks/redux';
import { selectTotalBalance } from '../store/slices/accountsSlice';
import { selectPropertyValue } from '../store/slices/heritagesSlice';
import { selectPortfolioValue } from '../store/slices/investmentsSlice';
import { selectRetirementValue } from '../store/slices/retirementAccountsSlice';

interface BreakdownItem {
    label: string;
    value: number;
    icon: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatSignedCurrency(value: number): string {
    const absValue = Math.abs(value);
    const formatted = currencyFormatter.format(absValue);
    return value < 0 ? `-${formatted}` : formatted;
}

const NetWorthView = memo(function NetWorthView() {
    const cashBalance = useAppSelector(selectTotalBalance);
    const investmentsValue = useAppSelector(selectPortfolioValue);
    const heritageValue = useAppSelector(selectPropertyValue);
    const retirementValue = useAppSelector(selectRetirementValue);
    const liabilities = useAppSelector((state) =>
        state.accounts.accounts.reduce((total, account) => {
            if (account.account_type !== 'credit_card') {
                return total;
            }

            return total + Math.abs(account.total_balance || 0);
        }, 0)
    );

    const netWorth =
        cashBalance +
        investmentsValue +
        heritageValue +
        retirementValue -
        liabilities;

    const breakdownItems = useMemo<BreakdownItem[]>(
        () => [
            {
                label: 'Cash & Accounts',
                value: cashBalance,
                icon: '💰',
            },
            {
                label: 'Investments',
                value: investmentsValue,
                icon: '📈',
            },
            {
                label: 'Real Estate',
                value: heritageValue,
                icon: '🏠',
            },
            {
                label: 'Retirement',
                value: retirementValue,
                icon: '🛡️',
            },
        ],
        [cashBalance, investmentsValue, heritageValue, retirementValue]
    );

    return (
        <section className='card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1'>
            {/* Header bar — matches other dashboard cards */}
            <div className='bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4'>
                <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div className='flex items-center'>
                        <span className='text-2xl'>💰</span>
                        <div className='ml-3'>
                            <p className='text-xs text-white/80 font-medium'>
                                Unified Overview
                            </p>
                            <h2 className='text-lg font-semibold text-white'>
                                Total Net Worth
                            </h2>
                        </div>
                    </div>
                    <p
                        className={`text-2xl md:text-3xl font-bold tabular-nums tracking-tight text-white`}
                    >
                        {formatSignedCurrency(netWorth)}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className='card-body p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {breakdownItems.map((item) => (
                        <div
                            key={item.label}
                            className='rounded-xl border border-base-300 bg-base-200 p-4'
                        >
                            <p className='text-2xl leading-none'>{item.icon}</p>
                            <p className='text-sm text-base-content/70 mt-2'>
                                {item.label}
                            </p>
                            <p className='text-xl font-semibold tabular-nums mt-1 text-base-content'>
                                {formatSignedCurrency(item.value)}
                            </p>
                        </div>
                    ))}
                </div>

                <div className='mt-4 rounded-xl border border-error/20 bg-error/10 p-4'>
                    <div className='flex items-center justify-between gap-3'>
                        <p className='text-sm text-base-content/80'>
                            Debts &amp; Liabilities
                        </p>
                        <p className='text-xl font-semibold tabular-nums text-error'>
                            -{currencyFormatter.format(liabilities)}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
});

export default NetWorthView;
