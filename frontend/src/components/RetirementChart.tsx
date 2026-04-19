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

import { CHART_COLORS } from '../utils/chartColors';
import {
    aggregateData,
    formatDateLabel,
    getAggregationLevel,
} from '../utils/dataAggregation';
import { formatCurrency } from '../utils/formatters';
import ChartEmptyState from './ChartEmptyState';

interface RetirementAccount {
    id: number;
    name: string;
    account_type: string;
    provider: string;
    account_number: string | null;
    current_balance: number;
    monthly_contribution: number;
    employer_match_percentage: number;
    employer_match_limit: number;
    risk_level: string;
    target_retirement_age: number;
    notes: string | null;
    annual_contribution: number;
    employer_match_amount: number;
    total_annual_contribution: number;
    created_at?: string | null;
}

interface RetirementChartProps {
    retirementAccounts: RetirementAccount[];
    startDate?: Date;
    endDate?: Date;
}

function RetirementChart({
    retirementAccounts,
    startDate,
    endDate,
}: RetirementChartProps) {
    const {
        pieData,
        trendData,
        trendLevel,
        totalBalance,
        totalContributionsThisYear,
    } = useMemo(() => {
        const byType: Record<string, number> = {};
        let totalBalance = 0;
        let totalContributionsThisYear = 0;
        for (const a of retirementAccounts) {
            const type = a.account_type.replace('_', ' ').toUpperCase();
            byType[type] = (byType[type] ?? 0) + (a.current_balance || 0);
            totalBalance += a.current_balance || 0;
            totalContributionsThisYear += a.annual_contribution || 0;
        }

        const pieData = Object.entries(byType).map(([type, value]) => ({
            name: type,
            value: Math.round(value),
        }));

        const datedAccounts = retirementAccounts
            .map((account) => ({
                ...account,
                date: account.created_at ? new Date(account.created_at) : null,
            }))
            .filter(
                (account) => account.date && !isNaN(account.date.getTime())
            );

        const fallbackDate = new Date();
        const minDate = datedAccounts.length
            ? new Date(
                  Math.min(
                      ...datedAccounts.map((account) =>
                          (account.date as Date).getTime()
                      )
                  )
              )
            : fallbackDate;
        const maxDate = datedAccounts.length
            ? new Date(
                  Math.max(
                      ...datedAccounts.map((account) =>
                          (account.date as Date).getTime()
                      )
                  )
              )
            : fallbackDate;

        const rangeStart = startDate ?? minDate;
        const rangeEnd = endDate ?? maxDate;
        const trendLevel = getAggregationLevel(rangeStart, rangeEnd);

        const trendPoints = datedAccounts
            .filter((account) => {
                const createdAt = account.date as Date;
                return createdAt >= rangeStart && createdAt <= rangeEnd;
            })
            .map((account) => ({
                date: (account.date as Date).toISOString(),
                value: account.current_balance || 0,
            }));

        const trendData = aggregateData(trendPoints, trendLevel);

        return {
            pieData,
            trendData,
            trendLevel,
            totalBalance,
            totalContributionsThisYear,
        };
    }, [endDate, retirementAccounts, startDate]);

    // Handle empty or invalid data
    if (!retirementAccounts || retirementAccounts.length === 0) {
        return (
            <ChartEmptyState
                icon='💼'
                title='No retirement data yet'
                description='Add retirement accounts to track balances and long-term contributions.'
            />
        );
    }

    return (
        <div className='space-y-6'>
            {/* Summary Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Total Retirement Balance
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Contributions This Year
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalContributionsThisYear)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Projected at Retirement
                    </div>
                    <div className='text-2xl font-bold tabular-nums'>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Account Types Pie Chart */}
                <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                    <h4 className='text-lg font-medium text-base-content mb-4'>
                        Retirement Accounts by Type
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={220}
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
                                            CHART_COLORS.retirement[
                                                index %
                                                    CHART_COLORS.retirement
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

                {/* Top Accounts Bar Chart */}
                <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                    <h4 className='text-lg font-medium text-base-content mb-4'>
                        Retirement Balance Over Time
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={220}
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
                                        count === 1 ? 'account' : 'accounts';
                                    return [
                                        `${formatCurrency(
                                            numericValue
                                        )} (${count} ${countLabel})`,
                                        'Current Balance',
                                    ];
                                }}
                                labelFormatter={(date) =>
                                    formatDateLabel(String(date), trendLevel)
                                }
                            />
                            <Bar
                                dataKey='value'
                                fill={CHART_COLORS.retirement[0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Additional Info */}
            <div className='bg-base-100 p-4 rounded-lg shadow-sm'>
                <h4 className='text-lg font-medium text-base-content mb-4'>
                    Retirement Planning Summary
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <div>
                        <span className='font-medium'>Number of Accounts:</span>{' '}
                        {retirementAccounts.length}
                    </div>
                    <div>
                        <span className='font-medium'>
                            Average Monthly Contribution:
                        </span>{' '}
                        {formatCurrency(totalContributionsThisYear / 12)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RetirementChart;
