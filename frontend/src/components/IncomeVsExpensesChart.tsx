import {
    Bar,
    BarChart,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type { MonthlyIncomeExpense } from '../types/index';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

interface IncomeVsExpensesChartProps {
    data: MonthlyIncomeExpense[];
    isLoading?: boolean;
}

const MONTH_ABBREVIATIONS = [
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

function formatMonthTick(yearMonth: string): string {
    const parts = yearMonth.split('-');
    if (parts.length < 2) return yearMonth;
    const monthIndex = parseInt(parts[1]!, 10) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11)
        return yearMonth;
    return MONTH_ABBREVIATIONS[monthIndex]!;
}

function formatYAxisTick(value: number): string {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) {
        return `$${(absValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1_000) {
        return `$${(absValue / 1_000).toFixed(1)}k`;
    }
    return `$${absValue.toFixed(0)}`;
}

function IncomeVsExpensesChart({
    data,
    isLoading = false,
}: IncomeVsExpensesChartProps) {
    if (isLoading) {
        return (
            <div
                className='bg-base-100 p-4 rounded-lg shadow-sm'
                style={{ minHeight: '280px' }}
            >
                <div className='h-6 w-48 bg-base-300 rounded animate-pulse mb-4' />
                <div className='h-72 w-full bg-base-300 rounded animate-pulse' />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <ChartEmptyState
                icon='💰'
                title='No income vs expenses data'
                description='Add transactions to see your monthly income and expenses comparison.'
            />
        );
    }

    return (
        <div
            className='bg-base-100 p-4 rounded-lg shadow-sm'
            style={{
                minHeight: '340px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <h3 className='text-base font-semibold mb-4'>Income vs Expenses</h3>
            <ResponsiveContainer
                width='100%'
                height={300}
                minWidth={200}
                minHeight={200}
                style={{ flex: 1 }}
            >
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <XAxis
                        dataKey='month'
                        tick={{ fontSize: 12 }}
                        tickFormatter={(month) =>
                            formatMonthTick(String(month))
                        }
                    />
                    <YAxis
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatYAxisTick}
                    />
                    <Tooltip
                        formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name === 'income' ? 'Income' : 'Expenses',
                        ]}
                        labelFormatter={(label) =>
                            formatMonthTick(String(label))
                        }
                    />
                    <Legend
                        formatter={(value) =>
                            value === 'income' ? 'Income' : 'Expenses'
                        }
                    />
                    <Bar dataKey='income' fill='#22c55e' />
                    <Bar dataKey='expenses' fill='#ef4444' />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default IncomeVsExpensesChart;
