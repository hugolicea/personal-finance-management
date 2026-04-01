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

import { Investment } from '../types/investments';
import { CHART_COLORS } from '../utils/chartColors';
import {
    aggregateData,
    formatDateLabel,
    getAggregationLevel,
} from '../utils/dataAggregation';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

interface InvestmentsChartProps {
    investments: Investment[];
    startDate?: Date;
    endDate?: Date;
}

function InvestmentsChart({
    investments,
    startDate,
    endDate,
}: InvestmentsChartProps) {
    const {
        pieData,
        trendData,
        trendLevel,
        totalValue,
        totalGainLoss,
        avgGainLoss,
    } = useMemo(() => {
        const byType: Record<string, number> = {};
        let totalValue = 0;
        let totalGainLoss = 0;

        for (const investment of investments) {
            const type = investment.investment_type
                .replace('_', ' ')
                .toUpperCase();
            byType[type] =
                (byType[type] ?? 0) + (investment.current_value || 0);
            totalValue += investment.current_value || 0;
            totalGainLoss += investment.gain_loss || 0;
        }

        const pieData = Object.entries(byType).map(([type, value]) => ({
            name: type,
            value: Math.round(value),
        }));

        const datedInvestments = investments.filter((investment) => {
            const purchaseDate = new Date(investment.purchase_date);
            return !isNaN(purchaseDate.getTime());
        });

        const fallbackDate = new Date();
        const minDate = datedInvestments.length
            ? new Date(
                  Math.min(
                      ...datedInvestments.map((investment) =>
                          new Date(investment.purchase_date).getTime()
                      )
                  )
              )
            : fallbackDate;
        const maxDate = datedInvestments.length
            ? new Date(
                  Math.max(
                      ...datedInvestments.map((investment) =>
                          new Date(investment.purchase_date).getTime()
                      )
                  )
              )
            : fallbackDate;

        const rangeStart = startDate ?? minDate;
        const rangeEnd = endDate ?? maxDate;
        const trendLevel = getAggregationLevel(rangeStart, rangeEnd);

        const trendPoints = datedInvestments
            .filter((investment) => {
                const purchaseDate = new Date(investment.purchase_date);
                return purchaseDate >= rangeStart && purchaseDate <= rangeEnd;
            })
            .map((investment) => ({
                date: investment.purchase_date,
                value: investment.current_value || 0,
            }));

        const trendData = aggregateData(trendPoints, trendLevel);
        const avgGainLoss =
            investments.length > 0 ? totalGainLoss / investments.length : 0;

        return {
            pieData,
            trendData,
            trendLevel,
            totalValue,
            totalGainLoss,
            avgGainLoss,
        };
    }, [endDate, investments, startDate]);

    if (!investments || investments.length === 0) {
        return (
            <ChartEmptyState
                icon='📈'
                title='No investment data yet'
                description='Add investments to track your portfolio performance and allocation.'
            />
        );
    }

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Total Portfolio Value
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalValue)}
                    </div>
                </div>
                <div
                    className={`rounded-lg p-4 text-white ${
                        totalGainLoss >= 0
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                >
                    <div className='text-sm font-medium opacity-90'>
                        Total Gain/Loss
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {totalGainLoss >= 0 ? '+' : ''}
                        {formatCurrency(totalGainLoss)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Avg Performance
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {avgGainLoss >= 0 ? '+' : ''}
                        {avgGainLoss.toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                    <h4 className='text-lg font-medium text-base-content mb-4'>
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
                                            CHART_COLORS.investments[
                                                index %
                                                    CHART_COLORS.investments
                                                        .length
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

                <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                    <h4 className='text-lg font-medium text-base-content mb-4'>
                        Investment Value Over Time
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
                                        count === 1
                                            ? 'investment'
                                            : 'investments';
                                    return [
                                        `${formatCurrency(
                                            numericValue
                                        )} (${count} ${countLabel})`,
                                        'Current Value',
                                    ];
                                }}
                                labelFormatter={(date) =>
                                    formatDateLabel(String(date), trendLevel)
                                }
                            />
                            <Bar
                                dataKey='value'
                                fill={CHART_COLORS.investments[0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default InvestmentsChart;
