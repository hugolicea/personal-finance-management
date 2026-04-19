import { useMemo } from 'react';
import {
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

interface BalanceLineChartProps {
    transactions: Transaction[];
    isLoading?: boolean;
}

interface BalancePoint {
    date: string;
    balance: number;
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

function formatMonthTick(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;
    const monthIndex = parseInt(parts[1]!, 10) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateStr;
    return MONTH_ABBREVIATIONS[monthIndex]!;
}

function formatYAxisTick(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1_000_000) {
        return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1_000) {
        return `${sign}$${(absValue / 1_000).toFixed(1)}k`;
    }
    return `${sign}$${absValue.toFixed(0)}`;
}

function formatSignedCurrency(value: number): string {
    const sign = value < 0 ? '-' : '';
    return `${sign}${formatCurrency(value)}`;
}

function BalanceLineChart({
    transactions,
    isLoading = false,
}: BalanceLineChartProps) {
    const chartData = useMemo<BalancePoint[]>(() => {
        const sorted = [...transactions].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let runningBalance = 0;
        const byDate = new Map<string, number>();
        for (const t of sorted) {
            runningBalance += t.amount;
            byDate.set(t.date, runningBalance); // last write per date = end-of-day balance
        }

        return Array.from(byDate.entries()).map(([date, balance]) => ({
            date,
            balance,
        }));
    }, [transactions]);

    if (isLoading) {
        return (
            <div
                className='bg-base-100 p-4 rounded-lg shadow-sm'
                style={{ minHeight: '280px' }}
            >
                <div className='h-6 w-40 bg-base-300 rounded animate-pulse mb-4' />
                <div className='h-72 w-full bg-base-300 rounded animate-pulse' />
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <ChartEmptyState
                icon='📈'
                title='No transaction data available'
                description='Add transactions to see your balance over time.'
            />
        );
    }

    return (
        <div
            className='bg-base-100 p-4 rounded-lg shadow-sm'
            style={{ minHeight: '340px' }}
        >
            <h3 className='text-base font-semibold mb-4'>Balance Over Time</h3>
            <ResponsiveContainer
                width='100%'
                height={300}
                minWidth={200}
                minHeight={200}
            >
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <XAxis
                        dataKey='date'
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatMonthTick}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatYAxisTick}
                    />
                    <Tooltip
                        formatter={(value: number | string | undefined) => [
                            formatSignedCurrency(Number(value ?? 0)),
                            'Balance',
                        ]}
                        labelFormatter={(label: unknown) => {
                            const labelStr =
                                typeof label === 'string'
                                    ? label
                                    : String(label ?? '');
                            const parts = labelStr.split('-');
                            if (parts.length < 3) return labelStr;
                            const date = new Date(
                                parseInt(parts[0]!, 10),
                                parseInt(parts[1]!, 10) - 1,
                                parseInt(parts[2]!, 10)
                            );
                            if (isNaN(date.getTime())) return labelStr;
                            return date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            });
                        }}
                    />
                    <ReferenceLine
                        y={0}
                        stroke='#ef4444'
                        strokeDasharray='3 3'
                    />
                    <Line
                        type='monotone'
                        dataKey='balance'
                        stroke='#6366f1'
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default BalanceLineChart;
