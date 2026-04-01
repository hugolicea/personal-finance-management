import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import {
    InvestmentPayload,
    useCreateInvestment,
    useUpdateInvestment,
} from '../hooks/queries/useInvestmentsQuery';
import { Investment } from '../types/investments';
import { getTodayDate, toDateInputValue } from '../utils/dateHelpers';
import FormAutoSave from './FormAutoSave';

interface InvestmentFormProps {
    investment?: Investment;
    onClose: () => void;
}

const validationSchema = Yup.object({
    symbol: Yup.string()
        .required('Symbol is required')
        .max(20, 'Symbol must be less than 20 characters'),
    name: Yup.string()
        .required('Investment name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(200, 'Name must be less than 200 characters'),
    investment_type: Yup.string()
        .oneOf(
            ['stock', 'bond', 'etf', 'crypto', 'mutual_fund', 'fixed_income'],
            'Invalid investment type'
        )
        .required('Investment type is required'),
    // Traditional investment fields
    quantity: Yup.number().when('investment_type', {
        is: (type: string) => type !== 'fixed_income',
        then: (schema) =>
            schema
                .positive('Quantity must be positive')
                .required('Quantity is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    purchase_price: Yup.number().when('investment_type', {
        is: (type: string) => type !== 'fixed_income',
        then: (schema) =>
            schema
                .positive('Purchase price must be positive')
                .required('Purchase price is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    current_price: Yup.number().when('investment_type', {
        is: (type: string) => type !== 'fixed_income',
        then: (schema) => schema.positive('Current price must be positive'),
        otherwise: (schema) => schema.notRequired(),
    }),
    // Fixed income fields
    principal_amount: Yup.number().when('investment_type', {
        is: 'fixed_income',
        then: (schema) =>
            schema
                .positive('Principal amount must be positive')
                .required('Principal amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    interest_rate: Yup.number().when('investment_type', {
        is: 'fixed_income',
        then: (schema) =>
            schema
                .min(0, 'Interest rate must be non-negative')
                .max(100, 'Interest rate cannot exceed 100%')
                .required('Interest rate is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    compounding_frequency: Yup.string().when('investment_type', {
        is: 'fixed_income',
        then: (schema) =>
            schema
                .oneOf(
                    ['annual', 'semi_annual', 'quarterly', 'monthly'],
                    'Invalid compounding frequency'
                )
                .required('Compounding frequency is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    term_years: Yup.number().when('investment_type', {
        is: 'fixed_income',
        then: (schema) =>
            schema
                .positive('Term must be positive')
                .required('Term in years is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    purchase_date: Yup.date()
        .required('Purchase date is required')
        .max(new Date(), 'Purchase date cannot be in the future'),
    notes: Yup.string().max(500, 'Notes must be less than 500 characters'),
});

function InvestmentForm({ investment, onClose }: InvestmentFormProps) {
    const createMutation = useCreateInvestment();
    const updateMutation = useUpdateInvestment();

    const initialValues = {
        symbol: investment?.symbol || '',
        name: investment?.name || '',
        investment_type: investment?.investment_type || 'stock',
        quantity: investment?.quantity || 0,
        purchase_price: investment?.purchase_price || 0,
        current_price: investment?.current_price || '',
        purchase_date: investment?.purchase_date
            ? toDateInputValue(investment.purchase_date)
            : getTodayDate(),
        principal_amount: investment?.principal_amount || '',
        interest_rate: investment?.interest_rate || '',
        compounding_frequency: investment?.compounding_frequency || 'annual',
        term_years: investment?.term_years || '',
        notes: investment?.notes || '',
    };

    const handleSubmit = async (values: typeof initialValues) => {
        try {
            const data: InvestmentPayload = {
                symbol: values.symbol,
                name: values.name,
                investment_type: values.investment_type,
                quantity:
                    values.investment_type === 'fixed_income'
                        ? 1
                        : Number(values.quantity),
                purchase_price:
                    values.investment_type === 'fixed_income'
                        ? Number(values.principal_amount)
                        : Number(values.purchase_price),
                current_price:
                    values.current_price === ''
                        ? undefined
                        : Number(values.current_price),
                purchase_date: values.purchase_date!, // Formik validation ensures this is set
                notes: values.notes || undefined,
                principal_amount:
                    values.investment_type === 'fixed_income' &&
                    values.principal_amount !== ''
                        ? Number(values.principal_amount)
                        : undefined,
                interest_rate:
                    values.investment_type === 'fixed_income' &&
                    values.interest_rate !== ''
                        ? Number(values.interest_rate)
                        : undefined,
                compounding_frequency:
                    values.investment_type === 'fixed_income'
                        ? values.compounding_frequency
                        : undefined,
                term_years:
                    values.investment_type === 'fixed_income' &&
                    values.term_years !== ''
                        ? Number(values.term_years)
                        : undefined,
            };

            if (investment) {
                await updateMutation.mutateAsync({
                    id: investment.id,
                    data,
                });
            } else {
                await createMutation.mutateAsync(data);
            }
            onClose();
        } catch (error) {
            console.error('Error saving investment:', error);
        }
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ errors, touched, isSubmitting, values }) => (
                <Form className='space-y-8'>
                    <FormAutoSave
                        formName='investment-form'
                        initialValues={initialValues}
                    />
                    {/* Investment Information Section */}
                    <div className='bg-base-200 rounded-lg p-6 border border-base-300'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-primary'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                    />
                                </svg>
                            </div>
                            <h3 className='ml-3 text-lg font-medium'>
                                Investment Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div>
                                <label
                                    htmlFor='symbol'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Symbol <span className='text-error'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='symbol'
                                    id='symbol'
                                    className='input input-bordered w-full uppercase'
                                    placeholder='AAPL'
                                    aria-describedby={
                                        errors.symbol && touched.symbol
                                            ? 'symbol-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.symbol && touched.symbol
                                            ? true
                                            : undefined
                                    }
                                />
                                <ErrorMessage name='symbol'>
                                    {(msg) => (
                                        <span
                                            id='symbol-error'
                                            className='mt-2 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>

                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='name'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Investment Name{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='name'
                                    id='name'
                                    className='input input-bordered w-full'
                                    placeholder='e.g., Apple Inc., Bitcoin, Vanguard S&P 500 ETF'
                                    aria-describedby={
                                        errors.name && touched.name
                                            ? 'name-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.name && touched.name
                                            ? true
                                            : undefined
                                    }
                                />
                                <ErrorMessage name='name'>
                                    {(msg) => (
                                        <span
                                            id='name-error'
                                            className='mt-2 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>

                            <div>
                                <label
                                    htmlFor='investment_type'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Investment Type{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    as='select'
                                    name='investment_type'
                                    id='investment_type'
                                    className='input input-bordered w-full'
                                    aria-describedby={
                                        errors.investment_type &&
                                        touched.investment_type
                                            ? 'investment_type-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.investment_type &&
                                        touched.investment_type
                                            ? true
                                            : undefined
                                    }
                                >
                                    <option value='stock'>📈 Stock</option>
                                    <option value='bond'>📊 Bond</option>
                                    <option value='etf'>📊 ETF</option>
                                    <option value='crypto'>
                                        ₿ Cryptocurrency
                                    </option>
                                    <option value='mutual_fund'>
                                        🏛️ Mutual Fund
                                    </option>
                                    <option value='fixed_income'>
                                        💰 Fixed Income
                                    </option>
                                </Field>
                                <ErrorMessage name='investment_type'>
                                    {(msg) => (
                                        <span
                                            id='investment_type-error'
                                            className='mt-2 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>

                            {values.investment_type !== 'fixed_income' && (
                                <div>
                                    <label
                                        htmlFor='quantity'
                                        className='block text-sm font-semibold text-base-content mb-2'
                                    >
                                        Quantity{' '}
                                        <span className='text-error'>*</span>
                                    </label>
                                    <Field
                                        type='number'
                                        name='quantity'
                                        id='quantity'
                                        step='any'
                                        className='input input-bordered w-full'
                                        placeholder='100'
                                        aria-describedby={
                                            errors.quantity && touched.quantity
                                                ? 'quantity-error'
                                                : undefined
                                        }
                                        aria-invalid={
                                            errors.quantity && touched.quantity
                                                ? true
                                                : undefined
                                        }
                                    />
                                    <ErrorMessage name='quantity'>
                                        {(msg) => (
                                            <span
                                                id='quantity-error'
                                                className='mt-2 text-sm text-error font-medium'
                                                role='alert'
                                            >
                                                {msg}
                                            </span>
                                        )}
                                    </ErrorMessage>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Information Section */}
                    <div className='bg-success/10 rounded-lg p-6 border border-success/30'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-base-200 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-success'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <h3 className='ml-3 text-lg font-medium'>
                                Financial Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            {values.investment_type !== 'fixed_income' && (
                                <div>
                                    <label
                                        htmlFor='purchase_price'
                                        className='block text-sm font-semibold text-base-content mb-2'
                                    >
                                        Purchase Price{' '}
                                        <span className='text-error'>*</span>
                                    </label>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                            <span className='text-base-content/60 sm:text-sm font-medium'>
                                                $
                                            </span>
                                        </div>
                                        <Field
                                            type='number'
                                            name='purchase_price'
                                            id='purchase_price'
                                            step='any'
                                            className='input input-bordered w-full pl-8'
                                            placeholder='150.00'
                                            aria-describedby={
                                                errors.purchase_price &&
                                                touched.purchase_price
                                                    ? 'purchase_price-error'
                                                    : undefined
                                            }
                                            aria-invalid={
                                                errors.purchase_price &&
                                                touched.purchase_price
                                                    ? true
                                                    : undefined
                                            }
                                        />
                                    </div>
                                    <ErrorMessage name='purchase_price'>
                                        {(msg) => (
                                            <span
                                                id='purchase_price-error'
                                                className='mt-2 text-sm text-error font-medium'
                                                role='alert'
                                            >
                                                {msg}
                                            </span>
                                        )}
                                    </ErrorMessage>
                                </div>
                            )}

                            {values.investment_type === 'fixed_income' && (
                                <div>
                                    <label
                                        htmlFor='principal_amount'
                                        className='block text-sm font-semibold text-base-content mb-2'
                                    >
                                        Principal Amount{' '}
                                        <span className='text-error'>*</span>
                                    </label>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                            <span className='text-base-content/60 sm:text-sm font-medium'>
                                                $
                                            </span>
                                        </div>
                                        <Field
                                            type='number'
                                            name='principal_amount'
                                            id='principal_amount'
                                            step='any'
                                            className='input input-bordered w-full pl-8'
                                            placeholder='5000.00'
                                            aria-describedby={
                                                errors.principal_amount &&
                                                touched.principal_amount
                                                    ? 'principal_amount-error'
                                                    : undefined
                                            }
                                            aria-invalid={
                                                errors.principal_amount &&
                                                touched.principal_amount
                                                    ? true
                                                    : undefined
                                            }
                                        />
                                    </div>
                                    <ErrorMessage name='principal_amount'>
                                        {(msg) => (
                                            <span
                                                id='principal_amount-error'
                                                className='mt-2 text-sm text-error font-medium'
                                                role='alert'
                                            >
                                                {msg}
                                            </span>
                                        )}
                                    </ErrorMessage>
                                </div>
                            )}

                            {values.investment_type !== 'fixed_income' && (
                                <div>
                                    <label
                                        htmlFor='current_price'
                                        className='block text-sm font-semibold text-base-content mb-2'
                                    >
                                        Current Price
                                    </label>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                            <span className='text-base-content/60 sm:text-sm font-medium'>
                                                $
                                            </span>
                                        </div>
                                        <Field
                                            type='number'
                                            name='current_price'
                                            id='current_price'
                                            step='any'
                                            className='input input-bordered w-full pl-8'
                                            placeholder='175.00'
                                            aria-describedby={
                                                errors.current_price &&
                                                touched.current_price
                                                    ? 'current_price-error'
                                                    : undefined
                                            }
                                            aria-invalid={
                                                errors.current_price &&
                                                touched.current_price
                                                    ? true
                                                    : undefined
                                            }
                                        />
                                    </div>
                                    <p className='mt-2 text-xs text-base-content/60 font-medium'>
                                        Optional - for tracking unrealized
                                        gains/losses
                                    </p>
                                    <ErrorMessage name='current_price'>
                                        {(msg) => (
                                            <span
                                                id='current_price-error'
                                                className='mt-1 text-sm text-error font-medium'
                                                role='alert'
                                            >
                                                {msg}
                                            </span>
                                        )}
                                    </ErrorMessage>
                                </div>
                            )}

                            {values.investment_type === 'fixed_income' && (
                                <>
                                    <div>
                                        <label
                                            htmlFor='interest_rate'
                                            className='block text-sm font-semibold text-base-content mb-2'
                                        >
                                            Interest Rate (%){' '}
                                            <span className='text-error'>
                                                *
                                            </span>
                                        </label>
                                        <div className='relative'>
                                            <Field
                                                type='number'
                                                name='interest_rate'
                                                id='interest_rate'
                                                step='any'
                                                min='0'
                                                max='100'
                                                className='input input-bordered w-full'
                                                placeholder='8.00'
                                                aria-describedby={
                                                    errors.interest_rate &&
                                                    touched.interest_rate
                                                        ? 'interest_rate-error'
                                                        : undefined
                                                }
                                                aria-invalid={
                                                    errors.interest_rate &&
                                                    touched.interest_rate
                                                        ? true
                                                        : undefined
                                                }
                                            />
                                            <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
                                                <span className='text-base-content/60 sm:text-sm font-medium'>
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                        <ErrorMessage name='interest_rate'>
                                            {(msg) => (
                                                <span
                                                    id='interest_rate-error'
                                                    className='mt-2 text-sm text-error font-medium'
                                                    role='alert'
                                                >
                                                    {msg}
                                                </span>
                                            )}
                                        </ErrorMessage>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor='compounding_frequency'
                                            className='block text-sm font-semibold text-base-content mb-2'
                                        >
                                            Compounding Frequency{' '}
                                            <span className='text-error'>
                                                *
                                            </span>
                                        </label>
                                        <Field
                                            as='select'
                                            name='compounding_frequency'
                                            id='compounding_frequency'
                                            className='input input-bordered w-full'
                                            aria-describedby={
                                                errors.compounding_frequency &&
                                                touched.compounding_frequency
                                                    ? 'compounding_frequency-error'
                                                    : undefined
                                            }
                                            aria-invalid={
                                                errors.compounding_frequency &&
                                                touched.compounding_frequency
                                                    ? true
                                                    : undefined
                                            }
                                        >
                                            <option value='annual'>
                                                Annual
                                            </option>
                                            <option value='semi_annual'>
                                                Semi-Annual
                                            </option>
                                            <option value='quarterly'>
                                                Quarterly
                                            </option>
                                            <option value='monthly'>
                                                Monthly
                                            </option>
                                        </Field>
                                        <ErrorMessage name='compounding_frequency'>
                                            {(msg) => (
                                                <span
                                                    id='compounding_frequency-error'
                                                    className='mt-2 text-sm text-error font-medium'
                                                    role='alert'
                                                >
                                                    {msg}
                                                </span>
                                            )}
                                        </ErrorMessage>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor='term_years'
                                            className='block text-sm font-semibold text-base-content mb-2'
                                        >
                                            Term (Years){' '}
                                            <span className='text-error'>
                                                *
                                            </span>
                                        </label>
                                        <Field
                                            type='number'
                                            name='term_years'
                                            id='term_years'
                                            step='any'
                                            min='0'
                                            className='input input-bordered w-full'
                                            placeholder='5.00'
                                            aria-describedby={
                                                errors.term_years &&
                                                touched.term_years
                                                    ? 'term_years-error'
                                                    : undefined
                                            }
                                            aria-invalid={
                                                errors.term_years &&
                                                touched.term_years
                                                    ? true
                                                    : undefined
                                            }
                                        />
                                        <ErrorMessage name='term_years'>
                                            {(msg) => (
                                                <span
                                                    id='term_years-error'
                                                    className='mt-2 text-sm text-error font-medium'
                                                    role='alert'
                                                >
                                                    {msg}
                                                </span>
                                            )}
                                        </ErrorMessage>
                                    </div>
                                </>
                            )}

                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='purchase_date'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Purchase Date{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    type='date'
                                    name='purchase_date'
                                    id='purchase_date'
                                    className='input input-bordered w-full'
                                    aria-describedby={
                                        errors.purchase_date &&
                                        touched.purchase_date
                                            ? 'purchase_date-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.purchase_date &&
                                        touched.purchase_date
                                            ? true
                                            : undefined
                                    }
                                />
                                <ErrorMessage name='purchase_date'>
                                    {(msg) => (
                                        <span
                                            id='purchase_date-error'
                                            className='mt-2 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes Section */}
                    <div className='bg-base-200 rounded-lg p-6 border border-base-300'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-base-200 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-base-content/70'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                    />
                                </svg>
                            </div>
                            <h3 className='ml-3 text-lg font-medium'>
                                Additional Notes
                            </h3>
                        </div>

                        <div>
                            <Field
                                as='textarea'
                                name='notes'
                                id='notes'
                                rows={4}
                                className='textarea textarea-bordered w-full resize-none'
                                placeholder='Any additional information about this investment (strategy, goals, etc.)'
                                aria-describedby={
                                    errors.notes && touched.notes
                                        ? 'notes-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.notes && touched.notes
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='notes'>
                                {(msg) => (
                                    <span
                                        id='notes-error'
                                        className='mt-2 text-sm text-error font-medium'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-6 border-t border-base-300'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='btn btn-outline'
                        >
                            <svg
                                className='-ml-1 mr-2 h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='btn btn-primary'
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className='-ml-1 mr-2 h-4 w-4 animate-spin'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        ></circle>
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        ></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className='-ml-1 mr-2 h-4 w-4'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M5 13l4 4L19 7'
                                        />
                                    </svg>
                                    {investment
                                        ? 'Update Investment'
                                        : 'Add Investment'}
                                </>
                            )}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
}

export default InvestmentForm;
