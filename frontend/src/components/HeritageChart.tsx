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
    // Handle empty or invalid data
    if (!heritages || heritages.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No heritage data available
            </div>
        );
    }

    // Calculate heritage by type
    const heritageByType = heritages.reduce(
        (acc, heritage) => {
            const type = heritage.heritage_type.replace('_', ' ').toUpperCase();
            const value =
                heritage.current_value || heritage.purchase_price || 0;
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type] += value;
            return acc;
        },
        {} as Record<string, number>
    );

    const pieData = Object.entries(heritageByType).map(([type, value]) => ({
        name: type,
        value: Math.round(value),
    }));

    // Calculate top 5 properties by current value
    const topProperties = [...heritages]
        .sort(
            (a, b) =>
                (b.current_value || b.purchase_price || 0) -
                (a.current_value || a.purchase_price || 0)
        )
        .slice(0, 5)
        .map((heritage) => ({
            name:
                heritage.name.length > 15
                    ? heritage.name.substring(0, 15) + '...'
                    : heritage.name,
            value: Math.round(
                heritage.current_value || heritage.purchase_price || 0
            ),
            rental: heritage.monthly_rental_income || 0,
            yield: heritage.rental_yield_percentage || 0,
        }));

    const totalValue = heritages.reduce(
        (sum, h) => sum + (h.current_value || h.purchase_price || 0),
        0
    );
    const totalRentalIncome = heritages.reduce(
        (sum, h) => sum + (h.monthly_rental_income || 0),
        0
    );
    const avgYield =
        heritages.length > 0
            ? heritages.reduce(
                  (sum, h) => sum + (h.rental_yield_percentage || 0),
                  0
              ) / heritages.length
            : 0;

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
                <div className='bg-white p-4 rounded-lg shadow'>
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

                {/* Top Properties Bar Chart */}
                <div className='bg-white p-4 rounded-lg shadow'>
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
