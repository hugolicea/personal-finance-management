import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '../hooks/redux';
import {
    createRetirementAccount,
    updateRetirementAccount,
} from '../store/slices/retirementAccountsSlice';

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
    const dispatch = useAppDispatch();

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
                await dispatch(
                    updateRetirementAccount({
                        id: retirementAccount.id,
                        data: values,
                    })
                );
            } else {
                await dispatch(createRetirementAccount(values));
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
            {({ isSubmitting }) => (
                <Form className='space-y-8'>
                    {/* Account Information Section */}
                    <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
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
                            <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                Account Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='name'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Account Name{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='name'
                                    id='name'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white'
                                    placeholder='e.g., Main 401(k), Roth IRA'
                                />
                                <ErrorMessage
                                    name='name'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='account_type'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Account Type{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    as='select'
                                    name='account_type'
                                    id='account_type'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white'
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
                                <ErrorMessage
                                    name='account_type'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='provider'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Provider{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='provider'
                                    id='provider'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white'
                                    placeholder='e.g., Fidelity, Vanguard, Charles Schwab'
                                />
                                <ErrorMessage
                                    name='provider'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='account_number'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Account Number
                                </label>
                                <Field
                                    type='text'
                                    name='account_number'
                                    id='account_number'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white'
                                    placeholder='Last 4 digits for security (optional)'
                                />
                                <p className='mt-2 text-xs text-gray-500 font-medium'>
                                    Optional - for your reference only
                                </p>
                                <ErrorMessage
                                    name='account_number'
                                    component='div'
                                    className='mt-1 text-sm text-red-600 font-medium'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Information Section */}
                    <div className='bg-green-50 rounded-lg p-6 border border-green-200'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-green-600'
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
                            <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                Financial Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div>
                                <label
                                    htmlFor='current_balance'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Current Balance{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                        <span className='text-gray-500 sm:text-sm font-medium'>
                                            $
                                        </span>
                                    </div>
                                    <Field
                                        type='number'
                                        name='current_balance'
                                        id='current_balance'
                                        step='any'
                                        className='block w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='50000'
                                    />
                                </div>
                                <ErrorMessage
                                    name='current_balance'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='monthly_contribution'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Monthly Contribution{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                        <span className='text-gray-500 sm:text-sm font-medium'>
                                            $
                                        </span>
                                    </div>
                                    <Field
                                        type='number'
                                        name='monthly_contribution'
                                        id='monthly_contribution'
                                        step='any'
                                        className='block w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='500'
                                    />
                                </div>
                                <ErrorMessage
                                    name='monthly_contribution'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='employer_match_percentage'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Employer Match %{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <div className='relative'>
                                    <Field
                                        type='number'
                                        name='employer_match_percentage'
                                        id='employer_match_percentage'
                                        step='0.01'
                                        min='0'
                                        max='1'
                                        className='block w-full pr-8 pl-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='0.50'
                                    />
                                    <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
                                        <span className='text-gray-500 sm:text-sm font-medium'>
                                            %
                                        </span>
                                    </div>
                                </div>
                                <p className='mt-2 text-xs text-gray-500 font-medium'>
                                    e.g., 0.50 for 50% match
                                </p>
                                <ErrorMessage
                                    name='employer_match_percentage'
                                    component='div'
                                    className='mt-1 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='employer_match_limit'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Employer Match Limit{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                        <span className='text-gray-500 sm:text-sm font-medium'>
                                            $
                                        </span>
                                    </div>
                                    <Field
                                        type='number'
                                        name='employer_match_limit'
                                        id='employer_match_limit'
                                        step='any'
                                        className='block w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='6000'
                                    />
                                </div>
                                <p className='mt-2 text-xs text-gray-500 font-medium'>
                                    Annual maximum employer match
                                </p>
                                <ErrorMessage
                                    name='employer_match_limit'
                                    component='div'
                                    className='mt-1 text-sm text-red-600 font-medium'
                                />
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
                            <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                Planning Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div>
                                <label
                                    htmlFor='risk_level'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Risk Level{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    as='select'
                                    name='risk_level'
                                    id='risk_level'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 sm:text-sm bg-white'
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
                                <ErrorMessage
                                    name='risk_level'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='target_retirement_age'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Target Retirement Age{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    type='number'
                                    name='target_retirement_age'
                                    id='target_retirement_age'
                                    min='50'
                                    max='100'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 sm:text-sm bg-white'
                                    placeholder='65'
                                />
                                <ErrorMessage
                                    name='target_retirement_age'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes Section */}
                    <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
                        <div className='flex items-center mb-4'>
                            <div className='flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-4 h-4 text-gray-600'
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
                            <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                Additional Notes
                            </h3>
                        </div>

                        <div>
                            <Field
                                as='textarea'
                                name='notes'
                                id='notes'
                                rows={4}
                                className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 sm:text-sm bg-white resize-none'
                                placeholder='Any additional information about this retirement account (investment strategy, goals, etc.)'
                            />
                            <ErrorMessage
                                name='notes'
                                component='div'
                                className='mt-2 text-sm text-red-600 font-medium'
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-6 border-t border-gray-200'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200'
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
                            className='w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border-2 border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
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
