import { useMemo } from 'react';
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

import { Heritage } from '../types/heritage';
import { formatCurrency } from '../utils/formatters';

interface HeritageChartProps {
    heritages: Heritage[];
}

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function HeritageChart({ heritages }: HeritageChartProps) {
    const { pieData, topProperties, totalValue, totalRentalIncome, avgYield } =
        useMemo(() => {
            const byType: Record<string, number> = {};
            let totalValue = 0;
            let totalRentalIncome = 0;
            let totalYield = 0;
            for (const h of heritages) {
                const type = h.heritage_type.replace('_', ' ').toUpperCase();
                const value = h.current_value || h.purchase_price || 0;
                byType[type] = (byType[type] ?? 0) + value;
                totalValue += value;
                totalRentalIncome += h.monthly_rental_income || 0;
                totalYield += h.rental_yield_percentage || 0;
            }

            const pieData = Object.entries(byType).map(([type, value]) => ({
                name: type,
                value: Math.round(value),
            }));

            const topProperties = [...heritages]
                .sort(
                    (a, b) =>
                        (b.current_value || b.purchase_price || 0) -
                        (a.current_value || a.purchase_price || 0)
                )
                .slice(0, 5)
                .map((h) => ({
                    name:
                        h.name.length > 15
                            ? h.name.substring(0, 15) + '...'
                            : h.name,
                    value: Math.round(h.current_value || h.purchase_price || 0),
                    rental: h.monthly_rental_income || 0,
                    yield: h.rental_yield_percentage || 0,
                }));

            const avgYield =
                heritages.length > 0 ? totalYield / heritages.length : 0;

            return {
                pieData,
                topProperties,
                totalValue,
                totalRentalIncome,
                avgYield,
            };
        }, [heritages]);

    // Handle empty or invalid data
    if (!heritages || heritages.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No heritage data available
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Summary Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Total Property Value
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalValue)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Monthly Rental Income
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalRentalIncome)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Avg Rental Yield
                    </div>
                    <div className='text-2xl font-bold'>
                        {avgYield.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Property Types Pie Chart */}
                <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                    <h4 className='text-lg font-medium text-gray-900 mb-4'>
                        Properties by Type
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
                                    `${name} ${((percent || 0) * 100).toFixed(
                                        0
                                    )}%`
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

                {/* Top Properties Bar Chart */}
                <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                    <h4 className='text-lg font-medium text-gray-900 mb-4'>
                        Top 5 Properties by Value
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={300}
                        minWidth={200}
                        minHeight={200}
                    >
                        <BarChart data={topProperties}>
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
                                    name === 'value'
                                        ? formatCurrency(value as number)
                                        : `${value}%`,
                                    name === 'value'
                                        ? 'Property Value'
                                        : name === 'rental'
                                          ? 'Monthly Rent'
                                          : 'Yield %',
                                ]}
                            />
                            <Bar dataKey='value' fill='#00C49F' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default HeritageChart;
