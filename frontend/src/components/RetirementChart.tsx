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

import { formatCurrency } from '../utils/formatters';

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
}

interface RetirementChartProps {
    retirementAccounts: RetirementAccount[];
}

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function RetirementChart({ retirementAccounts }: RetirementChartProps) {
    // Handle empty or invalid data
    if (!retirementAccounts || retirementAccounts.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-gray-500'>
                No retirement account data available
            </div>
        );
    }

    // Calculate retirement accounts by type
    const accountsByType = retirementAccounts.reduce(
        (acc, account) => {
            const type = account.account_type.replace('_', ' ').toUpperCase();
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type] += account.current_balance || 0;
            return acc;
        },
        {} as Record<string, number>
    );

    const pieData = Object.entries(accountsByType).map(([type, value]) => ({
        name: type,
        value: Math.round(value),
    }));

    // Calculate top 5 accounts by balance
    const topAccounts = [...retirementAccounts]
        .sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0))
        .slice(0, 5)
        .map((account) => ({
            name:
                account.name.length > 15
                    ? account.name.substring(0, 15) + '...'
                    : account.name,
            balance: Math.round(account.current_balance || 0),
            contributions: account.annual_contribution || 0,
            projected: account.current_balance || 0, // Using current balance as projected since we don't have the projected field
        }));

    const totalBalance = retirementAccounts.reduce(
        (sum, a) => sum + (a.current_balance || 0),
        0
    );
    const totalContributionsThisYear = retirementAccounts.reduce(
        (sum, a) => sum + (a.annual_contribution || 0),
        0
    );
    const totalProjectedValue = retirementAccounts.reduce(
        (sum, a) => sum + (a.current_balance || 0),
        0
    ); // Using current balance as projected

    return (
        <div className='space-y-6'>
            {/* Summary Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Total Retirement Balance
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <div className='text-sm font-medium opacity-90'>
                        Contributions This Year
                    </div>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalContributionsThisYear)}
                    </div>
                </div>
                <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <div className='text-2xl font-bold'>
                        {formatCurrency(totalProjectedValue)}
                    </div>
                    <div className='text-sm font-medium opacity-90'>
                        Projected at Retirement
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Account Types Pie Chart */}
                <div className='bg-white p-4 rounded-lg shadow'>
                    <h4 className='text-lg font-medium text-gray-900 mb-4'>
                        Retirement Accounts by Type
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

                {/* Top Accounts Bar Chart */}
                <div className='bg-white p-4 rounded-lg shadow'>
                    <h4 className='text-lg font-medium text-gray-900 mb-4'>
                        Top 5 Retirement Accounts
                    </h4>
                    <ResponsiveContainer
                        width='100%'
                        height={300}
                        minWidth={200}
                        minHeight={200}
                    >
                        <BarChart data={topAccounts}>
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
                                    name === 'balance'
                                        ? 'Current Balance'
                                        : name === 'contributions'
                                          ? 'Contributions YTD'
                                          : 'Projected Value',
                                ]}
                            />
                            <Bar dataKey='balance' fill='#00C49F' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Additional Info */}
            <div className='bg-white p-4 rounded-lg shadow'>
                <h4 className='text-lg font-medium text-gray-900 mb-4'>
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
