import { ChangeEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// ── Shared helpers ────────────────────────────────────────────────────────────

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
    required,
    children,
}: {
    label: string;
    description?: string;
    required?: boolean;
    children: React.ReactNode;
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

const INPUT_CLS =
    'w-36 rounded border border-slate-500 bg-white px-3 py-1.5 text-sm text-slate-900 text-right shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const SELECT_CLS =
    'w-36 rounded border border-slate-500 bg-white px-3 py-1.5 text-sm text-slate-900 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

function FormButtons({
    onCalculate,
    onReset,
    disabled,
}: {
    onCalculate: () => void;
    onReset: () => void;
    disabled: boolean;
}) {
    return (
        <div className='flex justify-end gap-3 bg-slate-800 px-4 py-4'>
            <button
                onClick={onReset}
                className='rounded px-5 py-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-600 uppercase tracking-wide transition-colors'
            >
                Reset
            </button>
            <button
                onClick={onCalculate}
                disabled={disabled}
                className='rounded px-5 py-2 text-sm font-bold text-white bg-red-700 hover:bg-red-600 disabled:opacity-40 uppercase tracking-wide transition-colors'
            >
                Calculate
            </button>
        </div>
    );
}

function EmptyResults() {
    return (
        <div className='flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-400'>
            Fill in the form and click{' '}
            <strong className='mx-1'>Calculate</strong> to see results.
        </div>
    );
}

interface YearRow {
    year: number;
    principal: number;
    interest: number;
    balance: number;
}

function AmortizationChart({ schedule }: { schedule: YearRow[] }) {
    return (
        <div className='bg-white mx-4 mb-4 rounded-lg p-4'>
            <h3 className='text-sm font-semibold text-gray-700 text-center mb-3'>
                Annual Principal vs Interest
            </h3>
            <ResponsiveContainer width='100%' height={200}>
                <BarChart
                    data={schedule}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis
                        dataKey='year'
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={fmtAxis}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={55}
                    />
                    <Tooltip formatter={(v) => fmt(v as number)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                        dataKey='principal'
                        name='Principal'
                        stackId='a'
                        fill='#2a9d8f'
                    />
                    <Bar
                        dataKey='interest'
                        name='Interest'
                        stackId='a'
                        fill='#e76f51'
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function AmortizationTable({
    schedule,
    show,
    onToggle,
}: {
    schedule: YearRow[];
    show: boolean;
    onToggle: () => void;
}) {
    return (
        <>
            <div className='px-4 pb-4 text-center'>
                <button
                    onClick={onToggle}
                    className='px-8 py-2 bg-slate-800 text-white text-sm font-bold uppercase tracking-wide rounded hover:bg-slate-700 transition-colors'
                >
                    {show ? 'Hide Table' : 'Show Table'}
                </button>
            </div>
            {show && (
                <div className='bg-white mx-4 mb-4 rounded-lg overflow-hidden'>
                    <div className='overflow-auto max-h-72'>
                        <table className='min-w-full text-sm'>
                            <thead className='bg-gray-50 sticky top-0'>
                                <tr>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                        Year
                                    </th>
                                    <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide'>
                                        Principal
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
                                {schedule.map((row) => (
                                    <tr
                                        key={row.year}
                                        className='hover:bg-gray-50'
                                    >
                                        <td className='px-4 py-2 text-gray-700'>
                                            {row.year}
                                        </td>
                                        <td className='px-4 py-2 text-right text-emerald-600 font-medium'>
                                            {fmt(row.principal)}
                                        </td>
                                        <td className='px-4 py-2 text-right text-red-500'>
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
        </>
    );
}

// ── Mortgage Calculator ───────────────────────────────────────────────────────

interface MortgageInputs {
    homePrice: string;
    downPayment: string;
    termYears: string;
    rate: string;
    propertyTax: string;
    homeInsurance: string;
    pmi: string;
    hoa: string;
}

interface MortgageResult {
    loanAmount: number;
    monthlyPI: number;
    monthlyTax: number;
    monthlyInsurance: number;
    monthlyPMI: number;
    monthlyHOA: number;
    totalMonthly: number;
    totalInterest: number;
    totalPayment: number;
    ltv: number;
    schedule: YearRow[];
}

const DEFAULT_MORTGAGE: MortgageInputs = {
    homePrice: '300000',
    downPayment: '60000',
    termYears: '30',
    rate: '6.5',
    propertyTax: '1.1',
    homeInsurance: '1200',
    pmi: '',
    hoa: '0',
};

const MORTGAGE_TERMS = ['10', '15', '20', '25', '30'] as const;

function computeMortgage(inputs: MortgageInputs): MortgageResult | null {
    const homePrice = parseFloat(inputs.homePrice) || 0;
    const down = parseFloat(inputs.downPayment) || 0;
    const P = homePrice - down;
    const rate = parseFloat(inputs.rate) / 100 || 0;
    const years = parseInt(inputs.termYears, 10) || 0;
    const propTaxPct = parseFloat(inputs.propertyTax) / 100 || 0;
    const annualInsurance = parseFloat(inputs.homeInsurance) || 0;
    const hoa = parseFloat(inputs.hoa) || 0;

    if (P <= 0 || rate <= 0 || years <= 0) return null;

    const n = years * 12;
    const r = rate / 12;
    const factor = Math.pow(1 + r, n);
    const monthlyPI = (P * r * factor) / (factor - 1);
    const monthlyTax = (homePrice * propTaxPct) / 12;
    const monthlyInsurance = annualInsurance / 12;
    const ltv = P / homePrice;

    let monthlyPMI = parseFloat(inputs.pmi) || 0;
    if (!inputs.pmi && ltv > 0.8) {
        monthlyPMI = (P * 0.005) / 12; // auto: 0.5%/yr
    }

    const totalMonthly =
        monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + hoa;
    const totalInterest = monthlyPI * n - P;
    const totalPayment = monthlyPI * n;

    const schedule: YearRow[] = [];
    let balance = P;
    for (let y = 1; y <= years; y++) {
        let yearPrincipal = 0;
        let yearInterest = 0;
        for (let m = 0; m < 12; m++) {
            const interestPayment = balance * r;
            const principalPayment = monthlyPI - interestPayment;
            yearInterest += interestPayment;
            yearPrincipal += principalPayment;
            balance = Math.max(balance - principalPayment, 0);
        }
        schedule.push({
            year: y,
            principal: yearPrincipal,
            interest: yearInterest,
            balance,
        });
    }

    return {
        loanAmount: P,
        monthlyPI,
        monthlyTax,
        monthlyInsurance,
        monthlyPMI,
        monthlyHOA: hoa,
        totalMonthly,
        totalInterest,
        totalPayment,
        ltv,
        schedule,
    };
}

function MortgageCalculatorPanel() {
    const [inputs, setInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE);
    const [results, setResults] = useState<MortgageResult | null>(null);
    const [showTable, setShowTable] = useState(false);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setInputs((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const handleCalculate = useCallback(() => {
        setResults(computeMortgage(inputs));
        setShowTable(false);
    }, [inputs]);

    const handleReset = useCallback(() => {
        setInputs(DEFAULT_MORTGAGE);
        setResults(null);
        setShowTable(false);
    }, []);

    const isValid =
        parseFloat(inputs.homePrice) > 0 &&
        parseFloat(inputs.rate) > 0 &&
        parseInt(inputs.termYears) > 0;

    const homePrice = parseFloat(inputs.homePrice) || 0;
    const down = parseFloat(inputs.downPayment) || 0;
    const downPct = homePrice > 0 ? ((down / homePrice) * 100).toFixed(1) : '0';
    const loanAmount = Math.max(homePrice - down, 0);

    return (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Form */}
            <div className='overflow-hidden rounded-xl shadow-sm border border-gray-200'>
                <StepHeader step={1} title='Home & Loan Info' />
                <FieldRow label='Home Price' required>
                    <input
                        type='number'
                        name='homePrice'
                        min='0'
                        step='5000'
                        value={inputs.homePrice}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow
                    label='Down Payment'
                    description={`${downPct}% of home price — Loan: ${fmt(
                        loanAmount
                    )}`}
                >
                    <input
                        type='number'
                        name='downPayment'
                        min='0'
                        step='1000'
                        value={inputs.downPayment}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow label='Loan Term' required>
                    <select
                        name='termYears'
                        value={inputs.termYears}
                        onChange={handleChange}
                        className={SELECT_CLS}
                    >
                        {MORTGAGE_TERMS.map((t) => (
                            <option key={t} value={t}>
                                {t} years
                            </option>
                        ))}
                    </select>
                </FieldRow>
                <FieldRow label='Annual Interest Rate (%)' required>
                    <input
                        type='number'
                        name='rate'
                        min='0.01'
                        max='30'
                        step='0.05'
                        value={inputs.rate}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>

                <StepHeader step={2} title='Monthly Costs (Optional)' />
                <FieldRow label='Property Tax' description='Annual rate (%).'>
                    <input
                        type='number'
                        name='propertyTax'
                        min='0'
                        step='0.1'
                        value={inputs.propertyTax}
                        onChange={handleChange}
                        className={INPUT_CLS}
                        placeholder='1.1'
                    />
                </FieldRow>
                <FieldRow
                    label='Home Insurance'
                    description='Annual premium ($).'
                >
                    <input
                        type='number'
                        name='homeInsurance'
                        min='0'
                        step='100'
                        value={inputs.homeInsurance}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow label='HOA Fees' description='Monthly fees ($).'>
                    <input
                        type='number'
                        name='hoa'
                        min='0'
                        step='25'
                        value={inputs.hoa}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow
                    label='PMI (monthly)'
                    description='Leave blank to auto-calculate at 0.5%/yr when LTV > 80%.'
                >
                    <input
                        type='number'
                        name='pmi'
                        min='0'
                        step='10'
                        value={inputs.pmi}
                        onChange={handleChange}
                        className={INPUT_CLS}
                        placeholder='Auto'
                    />
                </FieldRow>

                <FormButtons
                    onCalculate={handleCalculate}
                    onReset={handleReset}
                    disabled={!isValid}
                />
            </div>

            {/* Results */}
            <div>
                {results ? (
                    <div className='rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-teal-700'>
                        <div className='px-6 py-5 text-center text-white'>
                            <h2 className='text-xl font-bold'>
                                Your Estimated Payment
                            </h2>
                            <p className='mt-2 text-base'>
                                Total monthly payment:{' '}
                                <span className='inline-block bg-teal-900 font-bold px-2 py-0.5 rounded'>
                                    {fmt(results.totalMonthly)}
                                </span>
                            </p>
                        </div>

                        {/* Monthly breakdown */}
                        <div className='bg-white mx-4 mb-4 rounded-lg overflow-hidden'>
                            <table className='min-w-full text-sm'>
                                <tbody className='divide-y divide-gray-100'>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-600'>
                                            Principal &amp; Interest
                                        </td>
                                        <td className='px-4 py-2 text-right font-semibold text-gray-900'>
                                            {fmt(results.monthlyPI)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-600'>
                                            Property Tax
                                        </td>
                                        <td className='px-4 py-2 text-right text-gray-700'>
                                            {fmt(results.monthlyTax)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-600'>
                                            Home Insurance
                                        </td>
                                        <td className='px-4 py-2 text-right text-gray-700'>
                                            {fmt(results.monthlyInsurance)}
                                        </td>
                                    </tr>
                                    {results.monthlyPMI > 0 && (
                                        <tr>
                                            <td className='px-4 py-2 text-gray-600'>
                                                PMI
                                                {results.ltv > 0.8
                                                    ? ' (auto)'
                                                    : ''}
                                            </td>
                                            <td className='px-4 py-2 text-right text-gray-700'>
                                                {fmt(results.monthlyPMI)}
                                            </td>
                                        </tr>
                                    )}
                                    {results.monthlyHOA > 0 && (
                                        <tr>
                                            <td className='px-4 py-2 text-gray-600'>
                                                HOA Fees
                                            </td>
                                            <td className='px-4 py-2 text-right text-gray-700'>
                                                {fmt(results.monthlyHOA)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className='bg-teal-50'>
                                        <td className='px-4 py-2 font-bold text-teal-800'>
                                            Total Monthly
                                        </td>
                                        <td className='px-4 py-2 text-right font-bold text-teal-800'>
                                            {fmt(results.totalMonthly)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Summary pills */}
                        <div className='grid grid-cols-2 gap-3 px-4 pb-4'>
                            {[
                                {
                                    label: 'Loan Amount',
                                    value: fmt(results.loanAmount),
                                },
                                {
                                    label: 'Total Interest',
                                    value: fmt(results.totalInterest),
                                },
                                {
                                    label: 'Total Payment (P+I)',
                                    value: fmt(results.totalPayment),
                                },
                                {
                                    label: 'LTV Ratio',
                                    value: `${(results.ltv * 100).toFixed(1)}%`,
                                },
                            ].map((p) => (
                                <div
                                    key={p.label}
                                    className='bg-teal-800 rounded-lg p-3 text-white'
                                >
                                    <p className='text-xs font-medium text-teal-300 uppercase tracking-wide'>
                                        {p.label}
                                    </p>
                                    <p className='mt-1 text-base font-bold'>
                                        {p.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <AmortizationChart schedule={results.schedule} />
                        <AmortizationTable
                            schedule={results.schedule}
                            show={showTable}
                            onToggle={() => setShowTable((v) => !v)}
                        />
                    </div>
                ) : (
                    <EmptyResults />
                )}
            </div>
        </div>
    );
}

// ── Auto Loan Calculator ──────────────────────────────────────────────────────

interface AutoInputs {
    vehiclePrice: string;
    downPayment: string;
    tradeIn: string;
    owedOnTradeIn: string;
    salesTax: string;
    termMonths: string;
    rate: string;
}

interface AutoResult {
    loanAmount: number;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    outOfPocket: number;
    schedule: YearRow[];
}

const DEFAULT_AUTO: AutoInputs = {
    vehiclePrice: '30000',
    downPayment: '3000',
    tradeIn: '0',
    owedOnTradeIn: '0',
    salesTax: '0',
    termMonths: '60',
    rate: '5.5',
};

const AUTO_TERMS = [
    { value: '24', label: '24 months (2 yr)' },
    { value: '36', label: '36 months (3 yr)' },
    { value: '48', label: '48 months (4 yr)' },
    { value: '60', label: '60 months (5 yr)' },
    { value: '72', label: '72 months (6 yr)' },
    { value: '84', label: '84 months (7 yr)' },
];

function computeAuto(inputs: AutoInputs): AutoResult | null {
    const price = parseFloat(inputs.vehiclePrice) || 0;
    const down = parseFloat(inputs.downPayment) || 0;
    const tradeIn = parseFloat(inputs.tradeIn) || 0;
    const owedOnTrade = parseFloat(inputs.owedOnTradeIn) || 0;
    const salesTaxPct = parseFloat(inputs.salesTax) / 100 || 0;
    const n = parseInt(inputs.termMonths, 10) || 0;
    const rate = parseFloat(inputs.rate) / 100 || 0;
    const r = rate / 12;

    if (price <= 0 || n <= 0) return null;

    const taxAmount = price * salesTaxPct;
    const loanAmount = Math.max(
        price + taxAmount - down - tradeIn + owedOnTrade,
        0
    );

    if (loanAmount <= 0) return null;

    let monthlyPayment: number;
    if (rate === 0) {
        monthlyPayment = loanAmount / n;
    } else {
        const factor = Math.pow(1 + r, n);
        monthlyPayment = (loanAmount * r * factor) / (factor - 1);
    }

    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - loanAmount;
    const outOfPocket = down + totalPayment;

    const schedule: YearRow[] = [];
    let balance = loanAmount;
    const totalYears = Math.ceil(n / 12);
    for (let y = 1; y <= totalYears; y++) {
        let yearPrincipal = 0;
        let yearInterest = 0;
        const monthsInYear = Math.min(12, n - (y - 1) * 12);
        for (let m = 0; m < monthsInYear; m++) {
            const interestPayment = balance * r;
            const principalPayment = monthlyPayment - interestPayment;
            yearInterest += interestPayment;
            yearPrincipal += principalPayment;
            balance = Math.max(balance - principalPayment, 0);
        }
        schedule.push({
            year: y,
            principal: yearPrincipal,
            interest: yearInterest,
            balance,
        });
    }

    return {
        loanAmount,
        monthlyPayment,
        totalPayment,
        totalInterest,
        outOfPocket,
        schedule,
    };
}

function AutoLoanCalculatorPanel() {
    const [inputs, setInputs] = useState<AutoInputs>(DEFAULT_AUTO);
    const [results, setResults] = useState<AutoResult | null>(null);
    const [showTable, setShowTable] = useState(false);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setInputs((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const handleCalculate = useCallback(() => {
        setResults(computeAuto(inputs));
        setShowTable(false);
    }, [inputs]);

    const handleReset = useCallback(() => {
        setInputs(DEFAULT_AUTO);
        setResults(null);
        setShowTable(false);
    }, []);

    const isValid =
        parseFloat(inputs.vehiclePrice) > 0 && parseInt(inputs.termMonths) > 0;

    return (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Form */}
            <div className='overflow-hidden rounded-xl shadow-sm border border-gray-200'>
                <StepHeader step={1} title='Vehicle Price' />
                <FieldRow label='Auto Price' required>
                    <input
                        type='number'
                        name='vehiclePrice'
                        min='0'
                        step='500'
                        value={inputs.vehiclePrice}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>

                <StepHeader step={2} title='Trade-in & Down Payment' />
                <FieldRow
                    label='Down Payment'
                    description='Amount you pay upfront ($).'
                >
                    <input
                        type='number'
                        name='downPayment'
                        min='0'
                        step='500'
                        value={inputs.downPayment}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow
                    label='Trade-in Value'
                    description='Value of your current vehicle ($).'
                >
                    <input
                        type='number'
                        name='tradeIn'
                        min='0'
                        step='500'
                        value={inputs.tradeIn}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow
                    label='Owed on Trade-in'
                    description='Amount still owed on your trade-in ($).'
                >
                    <input
                        type='number'
                        name='owedOnTradeIn'
                        min='0'
                        step='500'
                        value={inputs.owedOnTradeIn}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>
                <FieldRow
                    label='Sales Tax'
                    description='Sales tax rate in your state (%).'
                >
                    <input
                        type='number'
                        name='salesTax'
                        min='0'
                        max='20'
                        step='0.1'
                        value={inputs.salesTax}
                        onChange={handleChange}
                        className={INPUT_CLS}
                        placeholder='0'
                    />
                </FieldRow>

                <StepHeader step={3} title='Loan Details' />
                <FieldRow label='Loan Term' required>
                    <select
                        name='termMonths'
                        value={inputs.termMonths}
                        onChange={handleChange}
                        className={SELECT_CLS}
                    >
                        {AUTO_TERMS.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </FieldRow>
                <FieldRow label='Annual Interest Rate (%)' required>
                    <input
                        type='number'
                        name='rate'
                        min='0'
                        max='50'
                        step='0.1'
                        value={inputs.rate}
                        onChange={handleChange}
                        className={INPUT_CLS}
                    />
                </FieldRow>

                <FormButtons
                    onCalculate={handleCalculate}
                    onReset={handleReset}
                    disabled={!isValid}
                />
            </div>

            {/* Results */}
            <div>
                {results ? (
                    <div className='rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-teal-700'>
                        <div className='px-6 py-5 text-center text-white'>
                            <h2 className='text-xl font-bold'>
                                Your Estimated Payment
                            </h2>
                            <p className='mt-2 text-base'>
                                Monthly payment:{' '}
                                <span className='inline-block bg-teal-900 font-bold px-2 py-0.5 rounded'>
                                    {fmt(results.monthlyPayment)}
                                </span>
                            </p>
                        </div>

                        {/* Summary pills */}
                        <div className='grid grid-cols-2 gap-3 px-4 pb-4'>
                            {[
                                {
                                    label: 'Amount Financed',
                                    value: fmt(results.loanAmount),
                                },
                                {
                                    label: 'Total Interest',
                                    value: fmt(results.totalInterest),
                                },
                                {
                                    label: 'Total Payment',
                                    value: fmt(results.totalPayment),
                                },
                                {
                                    label: 'Total Out-of-Pocket',
                                    value: fmt(results.outOfPocket),
                                },
                            ].map((p) => (
                                <div
                                    key={p.label}
                                    className='bg-teal-800 rounded-lg p-3 text-white'
                                >
                                    <p className='text-xs font-medium text-teal-300 uppercase tracking-wide'>
                                        {p.label}
                                    </p>
                                    <p className='mt-1 text-base font-bold'>
                                        {p.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <AmortizationChart schedule={results.schedule} />
                        <AmortizationTable
                            schedule={results.schedule}
                            show={showTable}
                            onToggle={() => setShowTable((v) => !v)}
                        />
                    </div>
                ) : (
                    <EmptyResults />
                )}
            </div>
        </div>
    );
}

// ── Main tabbed component ─────────────────────────────────────────────────────

type Tab = 'mortgage' | 'auto';

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'mortgage', label: 'Mortgage', icon: '🏠' },
    { id: 'auto', label: 'Auto Loan', icon: '🚗' },
];

function LoanCalculator() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('mortgage');

    return (
        <div className='space-y-6'>
            {/* Page header */}
            <div className='flex items-center gap-3'>
                <button
                    onClick={() => navigate('/tools')}
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                    aria-label='Back to Financial Tools'
                >
                    ← Back
                </button>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        🏦 Loan Calculator
                    </h1>
                    <p className='mt-0.5 text-sm text-gray-500'>
                        Estimate your monthly payment, total interest, and
                        amortization schedule.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className='border-b border-gray-200'>
                <nav className='-mb-px flex gap-1'>
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                tab === t.id
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span role='img' aria-hidden='true'>
                                {t.icon}
                            </span>
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {tab === 'mortgage' ? (
                <MortgageCalculatorPanel />
            ) : (
                <AutoLoanCalculatorPanel />
            )}
        </div>
    );
}

export default LoanCalculator;
