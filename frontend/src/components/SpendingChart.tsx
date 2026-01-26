import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface Transaction {
    id: number;
    date: string;
    amount: string;
    description: string;
    category: number;
}

interface Category {
    id: number;
    name: string;
}

interface SpendingChartProps {
    transactions: Transaction[];
    categories: Category[];
}

function SpendingChart({ transactions, categories }: SpendingChartProps) {
    // Calculate spending by category (only expenses)
    const spendingByCategory = transactions
        .filter((t) => parseFloat(t.amount) < 0)
        .reduce(
            (acc, transaction) => {
                const categoryId = transaction.category;
                const amount = Math.abs(parseFloat(transaction.amount));

                if (!acc[categoryId]) {
                    acc[categoryId] = 0;
                }
                acc[categoryId] += amount;
                return acc;
            },
            {} as Record<number, number>
        );

    // Convert to chart data
    const chartData = Object.entries(spendingByCategory)
        .map(([categoryId, amount]) => {
            const category = categories.find(
                (c) => c.id === parseInt(categoryId)
            );
            return {
                name: category?.name || `Category ${categoryId}`,
                value: amount,
                categoryId: parseInt(categoryId),
            };
        })
        .sort((a, b) => b.value - a.value); // Sort by amount descending

    // Colors for the pie chart
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

    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: any) => {
        if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

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
    };

    if (chartData.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No expense data to display
            </div>
        );
    }

    return (
        <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='value'
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => [
                            `$${value.toFixed(2)}`,
                            'Amount',
                        ]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SpendingChart;
