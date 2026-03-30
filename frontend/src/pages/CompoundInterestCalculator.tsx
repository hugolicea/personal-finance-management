import { ChangeEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Inputs {
    principal: string;
    monthlyContribution: string;
    years: string;
    rate: string;
    variance: string;
    frequency: string;
}

interface ScheduleRow {
    year: number;
    balance: number;
    contributions: number;
    interest: number;
}

interface Results {
    finalAmount: number;
    totalContributions: number;
    totalInterest: number;
    years: number;
    schedule: ScheduleRow[];
    chartData: Record<string, number | string>[];
    rateKeys: { key: string; label: string; color: string }[];
}

const FREQUENCY_OPTIONS = [
    { value: '1', label: 'Annually' },
    { value: '2', label: 'Semi-annually' },
    { value: '4', label: 'Quarterly' },
    { value: '12', label: 'Monthly' },
    { value: '365', label: 'Daily' },
] as const;

const DEFAULT_INPUTS: Inputs = {
    principal: '10000',
    monthlyContribution: '100',
    years: '5',
    rate: '7',
    variance: '0',
    frequency: '12',
};

const RATE_COLORS = ['#457b9d', '#e85d04', '#2a9d8f'];

function fmt(value: number): string {
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    });
}

function fmtAxis(value: number): string {
    if (Math.abs(value) >= 1_000_000)
        return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

function calcFV(
    P: number,
    pmt: number,
    r: number,
    n: number,
    t: number
): number {
    const factor = Math.pow(1 + r / n, n * t);
    const pg = P * factor;
    // PMT is monthly; formula: pmt*12*(factor-1)/r works for any compound frequency
    const cg = r === 0 ? pmt * 12 * t : (pmt * 12 * (factor - 1)) / r;
    return pg + cg;
}

function compute(inputs: Inputs): Results {
    const P = parseFloat(inputs.principal) || 0;
    const pmt = parseFloat(inputs.monthlyContribution) || 0;
    const r = parseFloat(inputs.rate) / 100;
    const v = parseFloat(inputs.variance) / 100 || 0;
    const n = parseInt(inputs.frequency, 10) || 12;
    const t = Math.floor(parseFloat(inputs.years) || 0);

    const rates = v > 0 ? [Math.max(0, r - v), r, r + v] : [r];

    // Build year-by-year data for chart
    const chartData: Record<string, number | string>[] = [];
    for (let y = 0; y <= Math.min(t, 50); y++) {
        const row: Record<string, number | string> = { year: `Year ${y}` };
        for (const rate of rates) {
            const fv = y === 0 ? P : calcFV(P, pmt, rate, n, y);
            row[`fv_${rate.toFixed(4)}`] = Math.round(fv * 100) / 100;
        }
        row['contributions'] = P + pmt * 12 * y;
        chartData.push(row);
    }

    const rateKeys = rates.map((rate, i) => ({
        key: `fv_${rate.toFixed(4)}`,
        label: `Future Value (${(rate * 100).toFixed(2)}%)`,
        color: RATE_COLORS[i] ?? '#457b9d',
    }));

    // Schedule uses the base rate
    const schedule: ScheduleRow[] = [
        { year: 0, balance: P, contributions: P, interest: 0 },
    ];
    for (let y = 1; y <= Math.min(t, 50); y++) {
        const factor = Math.pow(1 + r / n, n * y);
        const pg = P * factor;
        const cg = r === 0 ? pmt * 12 * y : (pmt * 12 * (factor - 1)) / r;
        const bal = pg + cg;
        const contribs = P + pmt * 12 * y;
        schedule.push({
            year: y,
            balance: bal,
            contributions: contribs,
            interest: bal - contribs,
        });
    }

    const finalFV = calcFV(P, pmt, r, n, t);
    return {
        finalAmount: finalFV,
        totalContributions: P + pmt * 12 * t,
        totalInterest: finalFV - (P + pmt * 12 * t),
        years: t,
        schedule,
        chartData,
        rateKeys,
    };
}

function StepHeader({ step, title }: { step: number; title: string }) {
    return (
        <div className='bg-teal-700 px-4 py-2'>
            <h3 className='text-sm font-semibold text-white'>
                Step {step}: {title}
            </h3>
        </div>
    );
}

function FieldRow({
    label,
    description,
    children,
    required,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <div className='flex items-center justify-between gap-4 px-4 py-4 bg-slate-800 border-b border-slate-700 last:border-b-0'>
            <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-white'>
                    {label}
                    {required && <span className='ml-1 text-red-400'>*</span>}
                </p>
                {description && (
                    <p className='mt-0.5 text-xs text-slate-400 leading-snug'>
                        {description}
                    </p>
                )}
            </div>
            <div className='flex-shrink-0'>{children}</div>
        </div>
    );
}

const INPUT_CLS = 'input input-sm input-bordered w-36 text-right';

function CompoundInterestCalculator() {
    const navigate = useNavigate();
    const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
    const [results, setResults] = useState<Results | null>(null);
    const [showTable, setShowTable] = useState(false);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setInputs((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const handleCalculate = useCallback(() => {
        setResults(compute(inputs));
        setShowTable(false);
    }, [inputs]);

    const handleReset = useCallback(() => {
        setInputs(DEFAULT_INPUTS);
        setResults(null);
        setShowTable(false);
    }, []);

    const isValid =
        parseFloat(inputs.principal) >= 0 &&
        parseFloat(inputs.rate) > 0 &&
        parseFloat(inputs.years) > 0;

    return (
        <div className='space-y-6'>
            {/* Page header */}
            <div className='flex items-center gap-3'>
                <button
                    onClick={() => navigate('/tools')}
                    className='btn btn-ghost btn-sm'
                    aria-label='Back to Financial Tools'
                >
                    ← Back
                </button>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        📈 Compound Interest Calculator
                    </h1>
                    <p className='mt-0.5 text-sm text-gray-500'>
                        See how your money grows with the power of compounding.
                    </p>
                </div>
            </div>

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* ── Form ── */}
                <div className='overflow-hidden rounded-xl shadow-sm border border-base-300'>
                    {/* Step 1 */}
                    <StepHeader step={1} title='Initial Investment' />
                    <FieldRow
                        label='Initial Investment'
                        description='Amount of money that you have available to invest initially.'
                        required
                    >
                        <input
                            type='number'
                            name='principal'
                            min='0'
                            step='1000'
                            value={inputs.principal}
                            onChange={handleChange}
                            className={INPUT_CLS}
                            placeholder='$10,000'
                        />
                    </FieldRow>

                    {/* Step 2 */}
                    <StepHeader step={2} title='Contribute' />
                    <FieldRow
                        label='Monthly Contribution'
                        description='Amount that you plan to add to the principal every month, or a negative number for the amount that you plan to withdraw every month.'
                    >
                        <input
                            type='number'
                            name='monthlyContribution'
                            step='50'
                            value={inputs.monthlyContribution}
                            onChange={handleChange}
                            className={INPUT_CLS}
                            placeholder='$100'
                        />
                    </FieldRow>
                    <FieldRow
                        label='Length of Time in Years'
                        description='Length of time, in years, that you plan to save.'
                        required
                    >
                        <input
                            type='number'
                            name='years'
                            min='1'
                            max='50'
                            step='1'
                            value={inputs.years}
                            onChange={handleChange}
                            className={INPUT_CLS}
                            placeholder='10'
                        />
                    </FieldRow>

                    {/* Step 3 */}
                    <StepHeader step={3} title='Interest Rate' />
                    <FieldRow
                        label='Estimated Interest Rate'
                        description='Your estimated annual interest rate.'
                        required
                    >
                        <input
                            type='number'
                            name='rate'
                            min='0.01'
                            max='100'
                            step='0.1'
                            value={inputs.rate}
                            onChange={handleChange}
                            className={INPUT_CLS}
                            placeholder='7'
                        />
                    </FieldRow>
                    <FieldRow
                        label='Interest rate variance range'
                        description='Range of interest rates (above and below the rate set above) that you desire to see results for.'
                    >
                        <input
                            type='number'
                            name='variance'
                            min='0'
                            max='20'
                            step='0.5'
                            value={inputs.variance}
                            onChange={handleChange}
                            className={INPUT_CLS}
                            placeholder='0'
                        />
                    </FieldRow>

                    {/* Step 4 */}
                    <StepHeader step={4} title='Compound It' />
                    <FieldRow
                        label='Compound Frequency'
                        description='Times per year that interest will be compounded.'
                    >
                        <select
                            name='frequency'
                            value={inputs.frequency}
                            onChange={handleChange}
                            className={INPUT_CLS + ' text-left'}
                        >
                            {FREQUENCY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>

                    {/* Buttons */}
                    <div className='flex justify-end gap-3 bg-slate-800 px-4 py-4'>
                        <button
                            onClick={handleReset}
                            className='rounded px-5 py-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-600 uppercase tracking-wide transition-colors'
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleCalculate}
                            disabled={!isValid}
                            className='rounded px-5 py-2 text-sm font-bold text-white bg-red-700 hover:bg-red-600 disabled:opacity-40 uppercase tracking-wide transition-colors'
                        >
                            Calculate
                        </button>
                    </div>
                </div>

                {/* ── Results ── */}
                <div>
                    {results ? (
                        <div className='rounded-xl overflow-hidden shadow-sm border border-base-300 bg-teal-700'>
                            {/* Headline */}
                            <div className='px-6 py-5 text-center text-white'>
                                <h2 className='text-xl font-bold'>
                                    The Results Are In
                                </h2>
                                <p className='mt-2 text-base'>
                                    In{' '}
                                    <span className='inline-block bg-teal-900 font-bold px-2 py-0.5 rounded'>
                                        {results.years}
                                    </span>{' '}
                                    years, you will have{' '}
                                    <span className='inline-block bg-teal-900 font-bold px-2 py-0.5 rounded'>
                                        {fmt(results.finalAmount)}
                                    </span>
                                </p>
                            </div>

                            {/* Chart */}
                            <div className='bg-base-100 mx-4 mb-4 rounded-lg p-4'>
                                <h3 className='text-sm font-semibold text-gray-700 text-center mb-3'>
                                    Total Savings
                                </h3>
                                <ResponsiveContainer width='100%' height={220}>
                                    <LineChart
                                        data={results.chartData}
                                        margin={{
                                            top: 5,
                                            right: 10,
                                            left: 10,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray='3 3'
                                            stroke='#f0f0f0'
                                        />
                                        <XAxis
                                            dataKey='year'
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={fmtAxis}
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={60}
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                fmt(value as number)
                                            }
                                            labelStyle={{ fontWeight: 600 }}
                                        />
                                        <Legend
                                            iconType='circle'
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: 11 }}
                                        />
                                        {results.rateKeys.map(
                                            ({ key, label, color }) => (
                                                <Line
                                                    key={key}
                                                    type='monotone'
                                                    dataKey={key}
                                                    name={label}
                                                    stroke={color}
                                                    strokeWidth={2}
                                                    dot={{ r: 3, fill: color }}
                                                    activeDot={{ r: 5 }}
                                                />
                                            )
                                        )}
                                        <Line
                                            type='monotone'
                                            dataKey='contributions'
                                            name='Total Contributions'
                                            stroke='#2a9d8f'
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: '#2a9d8f' }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Summary pills */}
                            <div className='grid grid-cols-3 gap-3 px-4 pb-4 text-center'>
                                <div className='bg-teal-800 rounded-lg p-3 text-white'>
                                    <p className='text-xs font-medium text-teal-300 uppercase tracking-wide'>
                                        Final Balance
                                    </p>
                                    <p className='mt-1 text-lg font-bold'>
                                        {fmt(results.finalAmount)}
                                    </p>
                                </div>
                                <div className='bg-teal-800 rounded-lg p-3 text-white'>
                                    <p className='text-xs font-medium text-teal-300 uppercase tracking-wide'>
                                        Contributed
                                    </p>
                                    <p className='mt-1 text-lg font-bold'>
                                        {fmt(results.totalContributions)}
                                    </p>
                                </div>
                                <div className='bg-teal-800 rounded-lg p-3 text-white'>
                                    <p className='text-xs font-medium text-teal-300 uppercase tracking-wide'>
                                        Interest Earned
                                    </p>
                                    <p className='mt-1 text-lg font-bold'>
                                        {fmt(results.totalInterest)}
                                    </p>
                                </div>
                            </div>

                            {/* SHOW TABLE toggle */}
                            <div className='px-4 pb-4 text-center'>
                                <button
                                    onClick={() => setShowTable((v) => !v)}
                                    className='px-8 py-2 bg-slate-800 text-white text-sm font-bold uppercase tracking-wide rounded hover:bg-slate-700 transition-colors'
                                >
                                    {showTable ? 'Hide Table' : 'Show Table'}
                                </button>
                            </div>

                            {/* Year-by-year table */}
                            {showTable && (
                                <div className='bg-base-100 mx-4 mb-4 rounded-lg overflow-hidden'>
                                    <div className='overflow-auto max-h-72'>
                                        <table className='min-table table-zebra w-full'>
                                            <thead className='sticky top-0 bg-base-100'>
                                                <tr>
                                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                                        Year
                                                    </th>
                                                    <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                                        Contributed
                                                    </th>
                                                    <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                                        Interest
                                                    </th>
                                                    <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                                        Balance
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-gray-100'>
                                                {results.schedule.map((row) => (
                                                    <tr
                                                        key={row.year}
                                                        className=''
                                                    >
                                                        <td className='px-4 py-2 text-gray-700'>
                                                            {row.year}
                                                        </td>
                                                        <td className='px-4 py-2 text-right text-gray-700'>
                                                            {fmt(
                                                                row.contributions
                                                            )}
                                                        </td>
                                                        <td className='px-4 py-2 text-right text-emerald-600 font-medium'>
                                                            {fmt(row.interest)}
                                                        </td>
                                                        <td className='px-4 py-2 text-right font-semibold text-gray-900'>
                                                            {fmt(row.balance)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='flex h-48 items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100 text-sm opacity-60'>
                            Fill in the form and click{' '}
                            <strong className='mx-1'>Calculate</strong> to see
                            results.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CompoundInterestCalculator;
