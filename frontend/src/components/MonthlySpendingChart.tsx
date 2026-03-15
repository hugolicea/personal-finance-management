import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

interface MonthlySpendingChartProps {
    transactions: Transaction[];
    year?: number;
}

function MonthlySpendingChart({
    transactions,
    year,
}: MonthlySpendingChartProps) {
    const selectedYear = year ?? new Date().getFullYear();

    const { chartData, totalSpending, avgMonthlySpending, maxSpendingMonth } =
        useMemo(() => {
            const monthlySpending = transactions
                .filter((t) => {
                    const d = new Date(t.date);
                    return (
                        !isNaN(d.getTime()) &&
                        d.getFullYear() === selectedYear &&
                        typeof t.amount === 'number' &&
                        t.amount < 0
                    );
                })
                .reduce(
                    (acc, t) => {
                        const month = new Date(t.date).toLocaleString(
                            'default',
                            { month: 'short' }
                        );
                        acc[month] =
                            (acc[month] ?? 0) + Math.abs(t.amount as number);
                        return acc;
                    },
                    {} as Record<string, number>
                );

            const chartData = MONTH_NAMES.map((month) => ({
                month,
                spending: Math.round(monthlySpending[month] ?? 0),
            }));

            const totalSpending = chartData.reduce(
                (sum, m) => sum + m.spending,
                0
            );
            const avgMonthlySpending = totalSpending / 12;

            let maxSpendingMonth: { month: string; spending: number } | null =
                null;
            for (const m of chartData) {
                if (
                    maxSpendingMonth === null ||
                    m.spending > maxSpendingMonth.spending
                ) {
                    maxSpendingMonth = m;
                }
            }

            return {
                chartData,
                totalSpending,
                avgMonthlySpending,
                maxSpendingMonth,
            };
        }, [transactions, selectedYear]);

    // Handle empty or invalid data
    if (!transactions || transactions.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No transaction data available
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Summary Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Total Annual Spending
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalSpending)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Average Monthly
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(avgMonthlySpending)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Highest Month
                    </div>
                    <div className='text-2xl font-bold'>
                        {maxSpendingMonth ? (
                            <>
                                {maxSpendingMonth.month}:{' '}
                                {formatCurrency(maxSpendingMonth.spending)}
                            </>
                        ) : (
                            'No data'
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Spending Bar Chart */}
            <div
                className='bg-white p-4 rounded-lg shadow'
                style={{ minHeight: '400px' }}
            >
                <ResponsiveContainer
                    width='100%'
                    height={400}
                    minWidth={200}
                    minHeight={200}
                >
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                                `$${(value / 1000).toFixed(0)}k`
                            }
                        />
                        <Tooltip
                            formatter={(value) => [
                                formatCurrency(value as number),
                                'Spending',
                            ]}
                            labelFormatter={(label) =>
                                `${label} ${selectedYear}`
                            }
                        />
                        <Bar dataKey='spending' fill='#FF8042' />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default MonthlySpendingChart;
