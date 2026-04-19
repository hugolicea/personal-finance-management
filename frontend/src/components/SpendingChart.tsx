import { useMemo } from 'react';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    PieLabelRenderProps,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

import { Category } from '../types/categories';
import type { Transaction } from '../types/transactions';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

const COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#6b7280', // gray-500
];

interface SpendingChartProps {
    transactions: Transaction[];
    categories: Category[];
}

function renderCustomizedLabel(props: PieLabelRenderProps): JSX.Element | null {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (
        percent === undefined ||
        cx === undefined ||
        cy === undefined ||
        midAngle === undefined ||
        innerRadius === undefined ||
        outerRadius === undefined
    ) {
        return null;
    }
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill='white'
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline='central'
            fontSize={12}
            fontWeight='bold'
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

function SpendingChart({ transactions, categories }: SpendingChartProps) {
    const categoryMap = useMemo(
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories]
    );

    const chartData = useMemo(
        () =>
            Object.entries(
                transactions
                    .filter((t) => typeof t.amount === 'number' && t.amount < 0)
                    .reduce(
                        (acc, t) => {
                            acc[t.category] =
                                (acc[t.category] ?? 0) + Math.abs(t.amount);
                            return acc;
                        },
                        {} as Record<number, number>
                    )
            )
                .map(([categoryId, amount]) => {
                    const cid = parseInt(categoryId, 10);
                    return {
                        name: categoryMap.get(cid) ?? `Category ${categoryId}`,
                        value: amount,
                        categoryId: cid,
                    };
                })
                .sort((a, b) => b.value - a.value),
        [transactions, categoryMap]
    );

    if (chartData.length === 0) {
        return (
            <ChartEmptyState
                icon='🍩'
                title='No spending by category'
                description='Add transactions with categories to see your spending breakdown.'
            />
        );
    }

    return (
        <div className='h-80 w-full'>
            <ResponsiveContainer
                width='100%'
                height='100%'
                minWidth={200}
                minHeight={200}
            >
                <PieChart>
                    <Pie
                        data={chartData}
                        cx='50%'
                        cy='45%'
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius='80%'
                        fill='#8884d8'
                        dataKey='value'
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${entry.categoryId}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number | string | undefined) => [
                            formatCurrency(Number(value ?? 0)),
                            'Amount',
                        ]}
                    />
                    <Legend
                        layout='horizontal'
                        align='center'
                        verticalAlign='bottom'
                        iconSize={10}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SpendingChart;
