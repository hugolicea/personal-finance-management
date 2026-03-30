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
import {
    aggregateData,
    formatDateLabel,
    getAggregationLevel,
} from '../utils/dataAggregation';
import { CHART_COLORS } from '../utils/chartColors';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

interface HeritageChartProps {
    heritages: Heritage[];
    startDate?: Date;
    endDate?: Date;
}

function HeritageChart({ heritages, startDate, endDate }: HeritageChartProps) {
    const {
        pieData,
        trendData,
        trendLevel,
        totalValue,
        totalRentalIncome,
        avgYield,
    } = useMemo(() => {
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

        const datedProperties = heritages.filter((heritage) => {
            const purchaseDate = new Date(heritage.purchase_date);
            return !isNaN(purchaseDate.getTime());
        });

        const fallbackDate = new Date();
        const minDate = datedProperties.length
            ? new Date(
                  Math.min(
                      ...datedProperties.map((heritage) =>
                          new Date(heritage.purchase_date).getTime()
                      )
                  )
              )
            : fallbackDate;
        const maxDate = datedProperties.length
            ? new Date(
                  Math.max(
                      ...datedProperties.map((heritage) =>
                          new Date(heritage.purchase_date).getTime()
                      )
                  )
              )
            : fallbackDate;

        const rangeStart = startDate ?? minDate;
        const rangeEnd = endDate ?? maxDate;
        const trendLevel = getAggregationLevel(rangeStart, rangeEnd);

        const trendPoints = datedProperties
            .filter((heritage) => {
                const purchaseDate = new Date(heritage.purchase_date);
                return purchaseDate >= rangeStart && purchaseDate <= rangeEnd;
            })
            .map((heritage) => ({
                date: heritage.purchase_date,
                value: heritage.current_value || heritage.purchase_price || 0,
            }));

        const trendData = aggregateData(trendPoints, trendLevel);

        const avgYield =
            heritages.length > 0 ? totalYield / heritages.length : 0;

        return {
            pieData,
            trendData,
            trendLevel,
            totalValue,
            totalRentalIncome,
            avgYield,
        };
    }, [endDate, heritages, startDate]);

    // Handle empty or invalid data
    if (!heritages || heritages.length === 0) {
        return (
            <ChartEmptyState
                icon='🏠'
                title='No heritage data yet'
                description='Add properties to monitor your real estate value and rental income.'
            />
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
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalValue)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Monthly Rental Income
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalRentalIncome)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Avg Rental Yield
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
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
                                        fill={
                                            CHART_COLORS.heritage[
                                                index %
                                                    CHART_COLORS.heritage.length
                                            ]
                                        }
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
                        Property Value Over Time
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={300}
                        minWidth={200}
                        minHeight={200}
                    >
                        <BarChart data={trendData}>
                            <XAxis
                                dataKey='date'
                                tick={{ fontSize: 12 }}
                                tickFormatter={(date) =>
                                    formatDateLabel(String(date), trendLevel)
                                }
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) =>
                                    `$${(value / 1000).toFixed(0)}k`
                                }
                                domain={[0, 'auto']}
                            />
                            <Tooltip
                                formatter={(value, _name, item) => {
                                    const numericValue = Number(value) || 0;
                                    const count = item?.payload?.count ?? 0;
                                    const countLabel =
                                        count === 1 ? 'property' : 'properties';
                                    return [
                                        `${formatCurrency(
                                            numericValue
                                        )} (${count} ${countLabel})`,
                                        'Property Value',
                                    ];
                                }}
                                labelFormatter={(date) =>
                                    formatDateLabel(String(date), trendLevel)
                                }
                            />
                            <Bar
                                dataKey='value'
                                fill={CHART_COLORS.heritage[0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default HeritageChart;
