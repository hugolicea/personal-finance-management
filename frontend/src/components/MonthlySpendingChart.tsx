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
import {
    aggregateData,
    formatDateLabel,
    getAggregationLevel,
} from '../utils/dataAggregation';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

interface MonthlySpendingChartProps {
    transactions: Transaction[];
    year?: number;
    startDate?: Date;
    endDate?: Date;
}

function MonthlySpendingChart({
    transactions,
    year,
    startDate,
    endDate,
}: MonthlySpendingChartProps) {
    const selectedYear = year ?? new Date().getFullYear();

    const {
        chartData,
        level,
        totalSpending,
        avgMonthlySpending,
        maxSpendingPeriod,
    } = useMemo(() => {
        const rangeStart = startDate ?? new Date(selectedYear, 0, 1);
        const rangeEnd = endDate ?? new Date(selectedYear, 11, 31);
        const level = getAggregationLevel(rangeStart, rangeEnd);

        const spendingPoints = transactions
            .filter((transaction) => {
                const transactionDate = new Date(transaction.date);
                return (
                    !isNaN(transactionDate.getTime()) &&
                    transactionDate.getFullYear() === selectedYear &&
                    typeof transaction.amount === 'number' &&
                    transaction.amount < 0
                );
            })
            .map((transaction) => ({
                date: transaction.date,
                value: Math.abs(transaction.amount),
            }));

        const aggregatedData = aggregateData(spendingPoints, level);
        const chartData = aggregatedData.map((point) => ({
            date: point.date,
            spending: Math.round(point.value),
            count: point.count,
        }));

        const totalSpending = chartData.reduce((sum, m) => sum + m.spending, 0);
        const avgMonthlySpending = totalSpending / 12;

        let maxSpendingPeriod: { date: string; spending: number } | null = null;
        for (const m of chartData) {
            if (
                maxSpendingPeriod === null ||
                m.spending > maxSpendingPeriod.spending
            ) {
                maxSpendingPeriod = m;
            }
        }

        return {
            chartData,
            level,
            totalSpending,
            avgMonthlySpending,
            maxSpendingPeriod,
        };
    }, [endDate, selectedYear, startDate, transactions]);

    // Handle empty or invalid data
    if (!transactions || transactions.length === 0) {
        return (
            <ChartEmptyState
                icon='📊'
                title='No spending data yet'
                description='Upload a bank statement or add transactions to see your spending trends.'
            />
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
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalSpending)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Average Monthly
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(avgMonthlySpending)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Highest Month
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {maxSpendingPeriod ? (
                            <>
                                {formatDateLabel(maxSpendingPeriod.date, level)}
                                : {formatCurrency(maxSpendingPeriod.spending)}
                            </>
                        ) : (
                            'No data'
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Spending Bar Chart */}
            <div
                className='bg-base-100 p-4 rounded-lg shadow-sm'
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
                        <XAxis
                            dataKey='date'
                            tick={{ fontSize: 12 }}
                            tickFormatter={(date) =>
                                formatDateLabel(String(date), level)
                            }
                        />
                        <YAxis
                            domain={[0, 'auto']}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                                `$${(value / 1000).toFixed(0)}k`
                            }
                        />
                        <Tooltip
                            formatter={(value, _name, item) => {
                                const numericValue = Number(value) || 0;
                                const count = item?.payload?.count ?? 0;
                                const countLabel =
                                    count === 1
                                        ? 'transaction'
                                        : 'transactions';
                                return [
                                    `${formatCurrency(
                                        numericValue
                                    )} (${count} ${countLabel})`,
                                    'Spending',
                                ];
                            }}
                            labelFormatter={(label) =>
                                formatDateLabel(String(label), level)
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
