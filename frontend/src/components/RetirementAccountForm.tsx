import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import {
    useCreateRetirementAccount,
    useUpdateRetirementAccount,
} from '../hooks/queries/useRetirementAccountsQuery';
import FormAutoSave from './FormAutoSave';

interface RetirementAccountFormProps {
    retirementAccount?: {
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
    };
    onClose: () => void;
}

const RetirementAccountForm: React.FC<RetirementAccountFormProps> = ({
    retirementAccount,
    onClose,
}) => {
    const createMutation = useCreateRetirementAccount();
    const updateMutation = useUpdateRetirementAccount();

    const initialValues = {
        name: retirementAccount?.name || '',
        account_type: retirementAccount?.account_type || 'traditional_401k',
        provider: retirementAccount?.provider || '',
        account_number: retirementAccount?.account_number || '',
        current_balance: retirementAccount?.current_balance || 0,
        monthly_contribution: retirementAccount?.monthly_contribution || 0,
        employer_match_percentage:
            retirementAccount?.employer_match_percentage || 0,
        employer_match_limit: retirementAccount?.employer_match_limit || 0,
        risk_level: retirementAccount?.risk_level || 'moderate',
        target_retirement_age: retirementAccount?.target_retirement_age || 65,
        notes: retirementAccount?.notes || '',
    };

    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Account name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(200, 'Name must be less than 200 characters'),
        account_type: Yup.string()
            .required('Account type is required')
            .oneOf(
                [
                    'traditional_401k',
                    'roth_401k',
                    'traditional_ira',
                    'roth_ira',
                    'sep_ira',
                    'simple_ira',
                    'pension',
                    'annuity',
                    'other',
                ],
                'Invalid account type'
            ),
        provider: Yup.string()
            .required('Provider is required')
            .min(2, 'Provider must be at least 2 characters')
            .max(100, 'Provider must be less than 100 characters'),
        current_balance: Yup.number()
            .required('Current balance is required')
            .min(0, 'Balance cannot be negative'),
        monthly_contribution: Yup.number()
            .required('Monthly contribution is required')
            .min(0, 'Contribution cannot be negative'),
        employer_match_percentage: Yup.number()
            .required('Employer match percentage is required')
            .min(0, 'Percentage cannot be negative')
            .max(1, 'Percentage cannot exceed 100%'),
        employer_match_limit: Yup.number()
            .required('Employer match limit is required')
            .min(0, 'Limit cannot be negative'),
        risk_level: Yup.string()
            .required('Risk level is required')
            .oneOf(
                ['conservative', 'moderate', 'aggressive', 'very_aggressive'],
                'Invalid risk level'
            ),
        target_retirement_age: Yup.number()
            .required('Target retirement age is required')
            .min(50, 'Age must be at least 50')
            .max(100, 'Age must be less than 100'),
    });

    const handleSubmit = async (values: typeof initialValues) => {
        try {
            if (retirementAccount) {
                await updateMutation.mutateAsync({
                    id: retirementAccount.id,
                    data: values,
                });
            } else {
                await createMutation.mutateAsync(values);
            }
            onClose();
        } catch (error) {
            console.error('Error saving retirement account:', error);
        }
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ errors, touched, isSubmitting }) => (
                <Form className='space-y-8'>
                    <FormAutoSave
                        formName='retirement-account-form'
                        initialValues={initialValues}
                    />
                    {/* Account Information Section */}
                    <div className='bg-base-200 rounded-lg p-6 border border-base-300'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-blue-600'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                    />
                                </svg>
                            </div>
                            <h3 className='ml-3 text-lg font-medium'>
                                Account Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='name'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Account Name{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='name'
                                    id='name'
                                    className='input input-bordered w-full'
                                    placeholder='e.g., Main 401(k), Roth IRA'
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
                                    htmlFor='account_type'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Account Type{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    as='select'
                                    name='account_type'
                                    id='account_type'
                                    className='input input-bordered w-full'
                                    aria-describedby={
                                        errors.account_type &&
                                        touched.account_type
                                            ? 'account_type-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.account_type &&
                                        touched.account_type
                                            ? true
                                            : undefined
                                    }
                                >
                                    <option value='traditional_401k'>
                                        🏢 Traditional 401(k)
                                    </option>
                                    <option value='roth_401k'>
                                        💰 Roth 401(k)
                                    </option>
                                    <option value='traditional_ira'>
                                        📈 Traditional IRA
                                    </option>
                                    <option value='roth_ira'>
                                        💎 Roth IRA
                                    </option>
                                    <option value='sep_ira'>🏢 SEP IRA</option>
                                    <option value='simple_ira'>
                                        📊 SIMPLE IRA
                                    </option>
                                    <option value='pension'>🏛️ Pension</option>
                                    <option value='annuity'>📅 Annuity</option>
                                    <option value='other'>🔄 Other</option>
                                </Field>
                                <ErrorMessage name='account_type'>
                                    {(msg) => (
                                        <span
                                            id='account_type-error'
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
                                    htmlFor='provider'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Provider{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='provider'
                                    id='provider'
                                    className='input input-bordered w-full'
                                    placeholder='e.g., Fidelity, Vanguard, Charles Schwab'
                                    aria-describedby={
                                        errors.provider && touched.provider
                                            ? 'provider-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.provider && touched.provider
                                            ? true
                                            : undefined
                                    }
                                />
                                <ErrorMessage name='provider'>
                                    {(msg) => (
                                        <span
                                            id='provider-error'
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
                                    htmlFor='account_number'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Account Number
                                </label>
                                <Field
                                    type='text'
                                    name='account_number'
                                    id='account_number'
                                    className='input input-bordered w-full'
                                    placeholder='Last 4 digits for security (optional)'
                                    aria-describedby={
                                        errors.account_number &&
                                        touched.account_number
                                            ? 'account_number-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.account_number &&
                                        touched.account_number
                                            ? true
                                            : undefined
                                    }
                                />
                                <p className='mt-2 text-xs text-base-content/60 font-medium'>
                                    Optional - for your reference only
                                </p>
                                <ErrorMessage name='account_number'>
                                    {(msg) => (
                                        <span
                                            id='account_number-error'
                                            className='mt-1 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>
                        </div>
                    </div>

                    {/* Financial Information Section */}
                    <div className='bg-green-50 rounded-lg p-6 border border-green-200'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
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
                            <div>
                                <label
                                    htmlFor='current_balance'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Current Balance{' '}
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
                                        name='current_balance'
                                        id='current_balance'
                                        step='any'
                                        className='input input-bordered w-full pl-8'
                                        placeholder='50000'
                                        aria-describedby={
                                            errors.current_balance &&
                                            touched.current_balance
                                                ? 'current_balance-error'
                                                : undefined
                                        }
                                        aria-invalid={
                                            errors.current_balance &&
                                            touched.current_balance
                                                ? true
                                                : undefined
                                        }
                                    />
                                </div>
                                <ErrorMessage name='current_balance'>
                                    {(msg) => (
                                        <span
                                            id='current_balance-error'
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
                                    htmlFor='monthly_contribution'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Monthly Contribution{' '}
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
                                        name='monthly_contribution'
                                        id='monthly_contribution'
                                        step='any'
                                        className='input input-bordered w-full pl-8'
                                        placeholder='500'
                                        aria-describedby={
                                            errors.monthly_contribution &&
                                            touched.monthly_contribution
                                                ? 'monthly_contribution-error'
                                                : undefined
                                        }
                                        aria-invalid={
                                            errors.monthly_contribution &&
                                            touched.monthly_contribution
                                                ? true
                                                : undefined
                                        }
                                    />
                                </div>
                                <ErrorMessage name='monthly_contribution'>
                                    {(msg) => (
                                        <span
                                            id='monthly_contribution-error'
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
                                    htmlFor='employer_match_percentage'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Employer Match %{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <div className='relative'>
                                    <Field
                                        type='number'
                                        name='employer_match_percentage'
                                        id='employer_match_percentage'
                                        step='0.01'
                                        min='0'
                                        max='1'
                                        className='input input-bordered w-full pr-8'
                                        placeholder='0.50'
                                        aria-describedby={
                                            errors.employer_match_percentage &&
                                            touched.employer_match_percentage
                                                ? 'employer_match_percentage-error'
                                                : undefined
                                        }
                                        aria-invalid={
                                            errors.employer_match_percentage &&
                                            touched.employer_match_percentage
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
                                <p className='mt-2 text-xs text-base-content/60 font-medium'>
                                    e.g., 0.50 for 50% match
                                </p>
                                <ErrorMessage name='employer_match_percentage'>
                                    {(msg) => (
                                        <span
                                            id='employer_match_percentage-error'
                                            className='mt-1 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>

                            <div>
                                <label
                                    htmlFor='employer_match_limit'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Employer Match Limit{' '}
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
                                        name='employer_match_limit'
                                        id='employer_match_limit'
                                        step='any'
                                        className='input input-bordered w-full pl-8'
                                        placeholder='6000'
                                        aria-describedby={
                                            errors.employer_match_limit &&
                                            touched.employer_match_limit
                                                ? 'employer_match_limit-error'
                                                : undefined
                                        }
                                        aria-invalid={
                                            errors.employer_match_limit &&
                                            touched.employer_match_limit
                                                ? true
                                                : undefined
                                        }
                                    />
                                </div>
                                <p className='mt-2 text-xs text-base-content/60 font-medium'>
                                    Annual maximum employer match
                                </p>
                                <ErrorMessage name='employer_match_limit'>
                                    {(msg) => (
                                        <span
                                            id='employer_match_limit-error'
                                            className='mt-1 text-sm text-error font-medium'
                                            role='alert'
                                        >
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>
                        </div>
                    </div>

                    {/* Planning Information Section */}
                    <div className='bg-purple-50 rounded-lg p-6 border border-purple-200'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-purple-600'
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
                                Planning Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div>
                                <label
                                    htmlFor='risk_level'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Risk Level{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    as='select'
                                    name='risk_level'
                                    id='risk_level'
                                    className='input input-bordered w-full'
                                    aria-describedby={
                                        errors.risk_level && touched.risk_level
                                            ? 'risk_level-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.risk_level && touched.risk_level
                                            ? true
                                            : undefined
                                    }
                                >
                                    <option value='conservative'>
                                        🛡️ Conservative
                                    </option>
                                    <option value='moderate'>
                                        ⚖️ Moderate
                                    </option>
                                    <option value='aggressive'>
                                        📈 Aggressive
                                    </option>
                                    <option value='very_aggressive'>
                                        🚀 Very Aggressive
                                    </option>
                                </Field>
                                <ErrorMessage name='risk_level'>
                                    {(msg) => (
                                        <span
                                            id='risk_level-error'
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
                                    htmlFor='target_retirement_age'
                                    className='block text-sm font-semibold text-base-content mb-2'
                                >
                                    Target Retirement Age{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <Field
                                    type='number'
                                    name='target_retirement_age'
                                    id='target_retirement_age'
                                    min='50'
                                    max='100'
                                    className='input input-bordered w-full'
                                    placeholder='65'
                                    aria-describedby={
                                        errors.target_retirement_age &&
                                        touched.target_retirement_age
                                            ? 'target_retirement_age-error'
                                            : undefined
                                    }
                                    aria-invalid={
                                        errors.target_retirement_age &&
                                        touched.target_retirement_age
                                            ? true
                                            : undefined
                                    }
                                />
                                <ErrorMessage name='target_retirement_age'>
                                    {(msg) => (
                                        <span
                                            id='target_retirement_age-error'
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
                                placeholder='Any additional information about this retirement account (investment strategy, goals, etc.)'
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
                                    {retirementAccount
                                        ? 'Update Account'
                                        : 'Add Account'}
                                </>
                            )}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default RetirementAccountForm;
