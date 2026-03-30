import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    createTransaction,
    updateTransaction,
} from '../store/slices/transactionsSlice';
import type { Transaction } from '../types/transactions';
import { getTodayDate, toDateInputValue } from '../utils/dateHelpers';
import CategorySelect from './CategorySelect';
import FormAutoSave from './FormAutoSave';

interface TransactionFormProps {
    transaction?: Partial<Transaction>;
    onClose: () => void;
    accountId?: number;
    onDirtyChange?: (dirty: boolean) => void;
}

interface TransactionFormValues {
    amount: string;
    description: string;
    date: string;
    category: string;
    type: 'income' | 'expense';
}

const TransactionForm: React.FC<TransactionFormProps> = ({
    transaction,
    onClose,
    accountId,
    onDirtyChange,
}) => {
    const dispatch = useAppDispatch();
    const { categories, loading: categoriesLoading } = useAppSelector(
        (state) => state.categories
    );

    React.useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const initialValues: TransactionFormValues = {
        amount: transaction?.amount ? String(Math.abs(transaction.amount)) : '',
        description: transaction?.description || '',
        date: transaction?.date
            ? toDateInputValue(transaction.date)
            : getTodayDate(),
        category: transaction?.category ? String(transaction.category) : '',
        type: transaction?.amount
            ? transaction.amount < 0
                ? 'expense'
                : 'income'
            : 'expense',
    };

    const validationSchema = Yup.object({
        amount: Yup.number()
            .required('Amount is required')
            .notOneOf([0], 'Amount cannot be zero'),
        description: Yup.string()
            .required('Description is required')
            .min(2, 'Description must be at least 2 characters'),
        date: Yup.date()
            .required('Date is required')
            .max(new Date(), 'Date cannot be in the future'),
        category: Yup.number().required('Category is required'),
        type: Yup.string()
            .oneOf(['income', 'expense'], 'Invalid transaction type')
            .required('Type is required'),
    });

    const handleSubmit = async (values: TransactionFormValues) => {
        try {
            // Convert amount based on type: negative for expenses, positive for incomes
            const amount =
                values.type === 'expense'
                    ? -Math.abs(parseFloat(values.amount))
                    : Math.abs(parseFloat(values.amount));

            const baseData = {
                description: values.description,
                date: values.date!, // Formik validation ensures this is set
                amount: amount,
                category: Number(values.category),
            };

            if (transaction) {
                // Update existing transaction - don't include transaction_type
                await dispatch(
                    updateTransaction({
                        id: transaction.id!,
                        ...baseData,
                    })
                ).unwrap();
            } else {
                // Create new transaction
                await dispatch(
                    createTransaction({
                        ...baseData,
                        account: accountId!,
                    })
                ).unwrap();
            }
            onClose();
        } catch (error) {
            console.error('Failed to save transaction:', error);
        }
    };

    if (categoriesLoading) {
        return (
            <div className='flex justify-center items-center p-8'>
                <span className='loading loading-spinner text-primary loading-md'></span>
            </div>
        );
    }

    return (
        <div className='w-full'>
            <h2 className='text-xl font-bold mb-4'>
                {transaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form className='space-y-4'>
                        <FormAutoSave
                            formName='transaction-form'
                            initialValues={initialValues}
                            onDirtyChange={onDirtyChange}
                        />
                        <div>
                            <label
                                htmlFor='type'
                                className='block text-sm font-medium mb-1'
                            >
                                Type
                            </label>
                            <Field
                                as='select'
                                id='type'
                                name='type'
                                className='input input-bordered w-full'
                                aria-describedby={
                                    errors.type && touched.type
                                        ? 'type-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.type && touched.type
                                        ? true
                                        : undefined
                                }
                            >
                                <option value='expense'>Expense</option>
                                <option value='income'>Income</option>
                            </Field>
                            <ErrorMessage name='type'>
                                {(msg) => (
                                    <span
                                        id='type-error'
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
                                htmlFor='amount'
                                className='block text-sm font-medium mb-1'
                            >
                                Amount
                            </label>
                            <Field
                                id='amount'
                                type='number'
                                name='amount'
                                step='0.01'
                                className='input input-bordered w-full'
                                placeholder='0.00'
                                aria-describedby={
                                    errors.amount && touched.amount
                                        ? 'amount-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.amount && touched.amount
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='amount'>
                                {(msg) => (
                                    <span
                                        id='amount-error'
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
                                htmlFor='description'
                                className='block text-sm font-medium mb-1'
                            >
                                Description
                            </label>
                            <Field
                                id='description'
                                type='text'
                                name='description'
                                className='input input-bordered w-full'
                                placeholder='Transaction description'
                                aria-describedby={
                                    errors.description && touched.description
                                        ? 'description-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.description && touched.description
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='description'>
                                {(msg) => (
                                    <span
                                        id='description-error'
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
                                htmlFor='date'
                                className='block text-sm font-medium mb-1'
                            >
                                Date
                            </label>
                            <Field
                                id='date'
                                type='date'
                                name='date'
                                className='input input-bordered w-full'
                                aria-describedby={
                                    errors.date && touched.date
                                        ? 'date-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.date && touched.date
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='date'>
                                {(msg) => (
                                    <span
                                        id='date-error'
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
                                htmlFor='category'
                                className='block text-sm font-medium mb-1'
                            >
                                Category
                            </label>
                            <Field
                                id='category'
                                name='category'
                                as={CategorySelect}
                                categories={categories}
                                placeholder='Select a category'
                                className='input input-bordered w-full'
                            />
                            <ErrorMessage name='category'>
                                {(msg) => (
                                    <span
                                        id='category-error'
                                        className='text-error text-sm mt-1'
                                        role='alert'
                                    >
                                        {msg}
                                    </span>
                                )}
                            </ErrorMessage>
                        </div>

                        <div className='flex justify-end space-x-3 pt-4'>
                            <button
                                type='button'
                                onClick={onClose}
                                className='btn btn-ghost btn-sm'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='btn btn-primary btn-sm'
                            >
                                {isSubmitting
                                    ? 'Saving...'
                                    : transaction
                                      ? 'Update'
                                      : 'Add'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default TransactionForm;
