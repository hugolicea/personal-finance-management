import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Investment } from '../types/investments';
import { formatCurrency } from '../utils/formatters';

interface InvestmentsChartProps {
    investments: Investment[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function InvestmentsChart({ investments }: InvestmentsChartProps) {
    // Handle empty or invalid data
    if (!investments || investments.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No investment data available
            </div>
        );
    }

    // Calculate investments by type
    const investmentsByType = investments.reduce(
        (acc, investment) => {
            const type = investment.investment_type
                .replace('_', ' ')
                .toUpperCase();
            const value = investment.current_value || 0;
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type] += value;
            return acc;
        },
        {} as Record<string, number>
    );

    const pieData = Object.entries(investmentsByType).map(([type, value]) => ({
        name: type,
        value: Math.round(value),
    }));

    // Calculate top 5 investments by current value
    const topInvestments = [...investments]
        .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
        .slice(0, 5)
        .map((investment) => ({
            name: investment.symbol || 'Unknown',
            value: Math.round(investment.current_value || 0),
            gain: investment.gain_loss_percentage || 0,
        }));

    const totalValue = investments.reduce(
        (sum, inv) => sum + (inv.current_value || 0),
        0
    );
    const totalGainLoss = investments.reduce(
        (sum, inv) => sum + (inv.gain_loss || 0),
        0
    );
    const avgGainLoss =
        investments.length > 0 ? totalGainLoss / investments.length : 0;

    return (
        <div className='space-y-6'>
            {/* Summary Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Total Portfolio Value
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalValue)}
                    </div>
                </div>
                <div
                    className={`rounded-lg p-4 text-white ${totalGainLoss >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                >
                    <div className='text-sm font-medium opacity-90'>
                        Total Gain/Loss
                    </div>
                    <div className='text-2xl font-bold'>
                        {totalGainLoss >= 0 ? '+' : ''}
                        {formatCurrency(totalGainLoss)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Avg Performance
                    </div>
                    <div className='text-2xl font-bold'>
                        {avgGainLoss >= 0 ? '+' : ''}
                        {avgGainLoss.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Investment Types Pie Chart */}
                <div className='bg-white p-4 rounded-lg shadow'>
                    <h4 className='text-lg font-medium text-gray-900 mb-4'>
                        Portfolio by Type
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={300}
                        minWidth={200}
                        minHeight={200}
                    >
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx='50%'
                                cy='50%'
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill='#8884d8'
                                dataKey='value'
                            >
                                {pieData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) =>
                                    formatCurrency(value as number)
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Investments Bar Chart */}
                <div className='bg-white p-4 rounded-lg shadow'>
                    <h4 className='text-lg font-medium text-gray-900 mb-4'>
                        Top 5 Investments
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={300}
                        minWidth={200}
                        minHeight={200}
                    >
                        <BarChart data={topInvestments}>
                            <XAxis
                                dataKey='name'
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor='end'
                                height={60}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) =>
                                    `$${(value / 1000).toFixed(0)}k`
                                }
                            />
                            <Tooltip
                                formatter={(value, name) => [
                                    formatCurrency(value as number),
                                    name === 'value' ? 'Current Value' : name,
                                ]}
                            />
                            <Bar dataKey='value' fill='#0088FE' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default InvestmentsChart;
