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

interface MonthlySpendingChartProps {
    transactions: Transaction[];
    year?: number;
}

function MonthlySpendingChart({
    transactions,
    year,
}: MonthlySpendingChartProps) {
    // Handle empty or invalid data
    if (!transactions || transactions.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No transaction data available
            </div>
        );
    }

    // Aggregate spending by month for the selected year (or current year if not provided)
    const selectedYear = year || new Date().getFullYear();

    const monthlySpending = transactions
        .filter((transaction) => {
            const transactionDate = new Date(transaction.date);
            if (isNaN(transactionDate.getTime())) return false;
            return (
                transactionDate.getFullYear() === selectedYear &&
                typeof transaction.amount === 'number' &&
                transaction.amount < 0
            );
        })
        .reduce(
            (acc, transaction) => {
                const date = new Date(transaction.date);
                const monthKey = date.toLocaleString('default', {
                    month: 'short',
                });
                const amount = Math.abs(transaction.amount as number);

                if (!acc[monthKey]) {
                    acc[monthKey] = 0;
                }
                acc[monthKey] += amount;
                return acc;
            },
            {} as Record<string, number>
        );

    // Create data for all months, filling in zeros for months with no spending
    const monthNames = [
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

    const chartData = monthNames.map((month) => ({
        month,
        spending: Math.round(monthlySpending[month] || 0),
    }));

    const totalSpending = chartData.reduce(
        (sum, month) => sum + month.spending,
        0
    );
    const avgMonthlySpending = totalSpending / 12;
    const maxSpendingMonth = chartData.reduce(
        (max, month) => (month.spending > max.spending ? month : max),
        chartData[0]
    );

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
                        {maxSpendingMonth.month}:{' '}
                        {formatCurrency(maxSpendingMonth.spending)}
                    </div>
                </div>
            </div>

            {/* Monthly Spending Bar Chart */}
            <div
                className='bg-white p-4 rounded-lg shadow'
                style={{ minHeight: '400px' }}
            >
                {/* <h4 className='text-lg font-medium text-gray-900 mb-4'>
                    Monthly Spending Throughout {selectedYear}
                </h4> */}
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
