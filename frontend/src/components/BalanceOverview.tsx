import { formatCurrency } from '../utils/formatters';

interface Transaction {
    id: number;
    date: string;
    amount: string;
    description: string;
    category: number;
}

interface BalanceOverviewProps {
    transactions: Transaction[];
}

function BalanceOverview({ transactions }: BalanceOverviewProps) {
    const totalBalance = transactions.reduce((sum, t) => {
        const amount = parseFloat(t.amount);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const totalIncome = transactions
        .filter((t) => {
            const amount = parseFloat(t.amount);
            return !isNaN(amount) && amount > 0;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = Math.abs(
        transactions
            .filter((t) => {
                const amount = parseFloat(t.amount);
                return !isNaN(amount) && amount < 0;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    );

    return (
        <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                    Balance Overview
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='bg-gray-50 p-4 rounded-lg'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-gray-500'>
                                    Net Balance
                                </p>
                                <p className='text-xs text-gray-400'>
                                    Current Period
                                </p>
                            </div>
                            <div className='text-right'>
                                <p
                                    className={`text-lg font-semibold ${
                                        totalBalance >= 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}
                                >
                                    {formatCurrency(Math.abs(totalBalance))}
                                </p>
                                <p className='text-xs text-gray-500'>
                                    {totalBalance >= 0 ? 'surplus' : 'deficit'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='bg-green-50 p-4 rounded-lg'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-green-700'>
                                    Total Income
                                </p>
                                <p className='text-xs text-green-600'>
                                    Current Period
                                </p>
                            </div>
                            <div className='text-right'>
                                <p className='text-lg font-semibold text-green-600'>
                                    {formatCurrency(totalIncome)}
                                </p>
                                <p className='text-xs text-green-500'>income</p>
                            </div>
                        </div>
                    </div>
                    <div className='bg-red-50 p-4 rounded-lg'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-red-700'>
                                    Total Expenses
                                </p>
                                <p className='text-xs text-red-600'>
                                    Current Period
                                </p>
                            </div>
                            <div className='text-right'>
                                <p className='text-lg font-semibold text-red-600'>
                                    {formatCurrency(totalExpenses)}
                                </p>
                                <p className='text-xs text-red-500'>expenses</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BalanceOverview;
