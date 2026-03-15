import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '../hooks/redux';
import { createAccount, updateAccount } from '../store/slices/accountsSlice';
import type { BankAccount } from '../types/accounts';

interface AccountFormProps {
    account?: Partial<BankAccount>;
    onClose: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onClose }) => {
    const dispatch = useAppDispatch();

    const initialValues = {
        name: account?.name ?? '',
        account_type: account?.account_type ?? 'checking',
        institution: account?.institution ?? '',
        account_number: account?.account_number ?? '',
        currency: account?.currency ?? 'USD',
        notes: account?.notes ?? '',
        is_active: account?.is_active ?? true,
    };

    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Name is required')
            .min(2, 'Name must be at least 2 characters'),
        account_type: Yup.string().required('Account type is required'),
        institution: Yup.string(),
        account_number: Yup.string().max(
            50,
            'Account number must be 50 characters or fewer'
        ),
        currency: Yup.string()
            .required('Currency is required')
            .length(3, 'Currency must be a 3-letter code (e.g. USD)'),
        notes: Yup.string(),
        is_active: Yup.boolean(),
    });

    const handleSubmit = async (values: typeof initialValues) => {
        try {
            if (account?.id) {
                await dispatch(
                    updateAccount({ id: account.id, ...values })
                ).unwrap();
            } else {
                await dispatch(createAccount(values)).unwrap();
            }
            onClose();
        } catch (error) {
            console.error('Failed to save account:', error);
        }
    };

    return (
        <div className='bg-white p-6 rounded-lg shadow-lg max-w-md w-full'>
            <h2 className='text-xl font-bold mb-4'>
                {account?.id ? 'Edit Account' : 'Add Account'}
            </h2>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form className='space-y-4'>
                        <div>
                            <label
                                htmlFor='name'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Account Name *
                            </label>
                            <Field
                                id='name'
                                name='name'
                                type='text'
                                autoComplete='organization'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='e.g. Chase Checking'
                            />
                            <ErrorMessage
                                name='name'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='account_type'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Account Type *
                            </label>
                            <Field
                                as='select'
                                id='account_type'
                                name='account_type'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='checking'>🏦 Checking</option>
                                <option value='savings'>🏧 Savings</option>
                                <option value='credit_card'>
                                    💳 Credit Card
                                </option>
                                <option value='cash'>💵 Cash</option>
                                <option value='investment'>
                                    📈 Investment
                                </option>
                                <option value='other'>🏛️ Other</option>
                            </Field>
                            <ErrorMessage
                                name='account_type'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='institution'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Institution
                            </label>
                            <Field
                                id='institution'
                                name='institution'
                                type='text'
                                autoComplete='organization'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='e.g. Chase Bank'
                            />
                            <ErrorMessage
                                name='institution'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='account_number'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Account Number
                                <span className='text-xs text-gray-400 ml-1'>
                                    (last 4 digits)
                                </span>
                            </label>
                            <Field
                                id='account_number'
                                name='account_number'
                                type='text'
                                maxLength={50}
                                autoComplete='off'
                                spellCheck={false}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='e.g. 1234'
                            />
                            <ErrorMessage
                                name='account_number'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='currency'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Currency *
                            </label>
                            <Field
                                id='currency'
                                name='currency'
                                type='text'
                                maxLength={3}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase'
                                placeholder='USD'
                            />
                            <ErrorMessage
                                name='currency'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='notes'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Notes
                            </label>
                            <Field
                                as='textarea'
                                id='notes'
                                name='notes'
                                rows={3}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Optional notes about this account'
                            />
                        </div>

                        <div className='flex items-center gap-2'>
                            <Field
                                type='checkbox'
                                id='is_active'
                                name='is_active'
                                className='h-4 w-4 text-blue-600 border-gray-300 rounded'
                            />
                            <label
                                htmlFor='is_active'
                                className='text-sm font-medium text-gray-700'
                            >
                                Active account
                            </label>
                        </div>

                        <div className='flex gap-3 pt-2'>
                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                            >
                                {isSubmitting
                                    ? 'Saving…'
                                    : account?.id
                                      ? 'Save Changes'
                                      : 'Add Account'}
                            </button>
                            <button
                                type='button'
                                onClick={onClose}
                                className='flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
                            >
                                Cancel
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default AccountForm;
