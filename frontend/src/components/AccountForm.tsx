import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '../hooks/redux';
import { createAccount, updateAccount } from '../store/slices/accountsSlice';
import type { BankAccount } from '../types/accounts';
import FormAutoSave from './FormAutoSave';

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
        <div className='w-full'>
            <h2 className='text-xl font-bold mb-4'>
                {account?.id ? 'Edit Account' : 'Add Account'}
            </h2>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form className='space-y-4'>
                        <FormAutoSave
                            formName='account-form'
                            initialValues={initialValues}
                        />
                        <div>
                            <label
                                htmlFor='name'
                                className='block text-sm font-medium mb-1'
                            >
                                Account Name *
                            </label>
                            <Field
                                id='name'
                                name='name'
                                type='text'
                                autoComplete='organization'
                                className='input input-bordered w-full'
                                placeholder='e.g. Chase Checking'
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
                                        className='text-error text-sm mt-1'
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
                                className='block text-sm font-medium mb-1'
                            >
                                Account Type *
                            </label>
                            <Field
                                as='select'
                                id='account_type'
                                name='account_type'
                                className='input input-bordered w-full'
                                aria-describedby={
                                    errors.account_type && touched.account_type
                                        ? 'account_type-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.account_type && touched.account_type
                                        ? true
                                        : undefined
                                }
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
                            <ErrorMessage name='account_type'>
                                {(msg) => (
                                    <span
                                        id='account_type-error'
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div>
                            <label
                                htmlFor='institution'
                                className='block text-sm font-medium mb-1'
                            >
                                Institution
                            </label>
                            <Field
                                id='institution'
                                name='institution'
                                type='text'
                                autoComplete='organization'
                                className='input input-bordered w-full'
                                placeholder='e.g. Chase Bank'
                                aria-describedby={
                                    errors.institution && touched.institution
                                        ? 'institution-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.institution && touched.institution
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='institution'>
                                {(msg) => (
                                    <span
                                        id='institution-error'
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div>
                            <label
                                htmlFor='account_number'
                                className='block text-sm font-medium mb-1'
                            >
                                Account Number
                                <span className='text-xs text-base-content/50 ml-1'>
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
                                className='input input-bordered w-full'
                                placeholder='e.g. 1234'
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
                            <ErrorMessage name='account_number'>
                                {(msg) => (
                                    <span
                                        id='account_number-error'
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div>
                            <label
                                htmlFor='currency'
                                className='block text-sm font-medium mb-1'
                            >
                                Currency *
                            </label>
                            <Field
                                id='currency'
                                name='currency'
                                type='text'
                                maxLength={3}
                                className='input input-bordered w-full uppercase'
                                placeholder='USD'
                                aria-describedby={
                                    errors.currency && touched.currency
                                        ? 'currency-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.currency && touched.currency
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='currency'>
                                {(msg) => (
                                    <span
                                        id='currency-error'
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div>
                            <label
                                htmlFor='notes'
                                className='block text-sm font-medium mb-1'
                            >
                                Notes
                            </label>
                            <Field
                                as='textarea'
                                id='notes'
                                name='notes'
                                rows={3}
                                className='textarea textarea-bordered w-full'
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
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div className='flex items-center gap-2'>
                            <Field
                                type='checkbox'
                                id='is_active'
                                name='is_active'
                                className='checkbox checkbox-primary checkbox-sm'
                                aria-describedby={
                                    errors.is_active && touched.is_active
                                        ? 'is_active-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.is_active && touched.is_active
                                        ? true
                                        : undefined
                                }
                            />
                            <label
                                htmlFor='is_active'
                                className='text-sm font-medium text-base-content/80'
                            >
                                Active account
                            </label>
                            <ErrorMessage name='is_active'>
                                {(msg) => (
                                    <span
                                        id='is_active-error'
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div className='flex gap-3 pt-2'>
                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='btn btn-primary flex-1'
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
                                className='btn btn-ghost flex-1'
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
