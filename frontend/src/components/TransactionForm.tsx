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

interface TransactionFormProps {
    transaction?: Partial<Transaction>;
    onClose: () => void;
    accountId?: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
    transaction,
    onClose,
    accountId,
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

    const initialValues = {
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

    const handleSubmit = async (values: typeof initialValues) => {
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
                {({ isSubmitting }) => (
                    <Form className='space-y-4'>
                        <div>
                            <label
                                htmlFor='type'
                                className='block text-sm font-medium mb-1'
                            >
                                Type
                            </label>
                            <Field
                                as='select'
                                name='type'
                                className='input input-bordered w-full'
                            >
                                <option value='expense'>Expense</option>
                                <option value='income'>Income</option>
                            </Field>
                            <ErrorMessage
                                name='type'
                                component='div'
                                className='text-error text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='amount'
                                className='block text-sm font-medium mb-1'
                            >
                                Amount
                            </label>
                            <Field
                                type='number'
                                name='amount'
                                step='0.01'
                                className='input input-bordered w-full'
                                placeholder='0.00'
                            />
                            <ErrorMessage
                                name='amount'
                                component='div'
                                className='text-error text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='description'
                                className='block text-sm font-medium mb-1'
                            >
                                Description
                            </label>
                            <Field
                                type='text'
                                name='description'
                                className='input input-bordered w-full'
                                placeholder='Transaction description'
                            />
                            <ErrorMessage
                                name='description'
                                component='div'
                                className='text-error text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='date'
                                className='block text-sm font-medium mb-1'
                            >
                                Date
                            </label>
                            <Field
                                type='date'
                                name='date'
                                className='input input-bordered w-full'
                            />
                            <ErrorMessage
                                name='date'
                                component='div'
                                className='text-error text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='category'
                                className='block text-sm font-medium mb-1'
                            >
                                Category
                            </label>
                            <Field
                                name='category'
                                as={CategorySelect}
                                categories={categories}
                                placeholder='Select a category'
                                className='input input-bordered w-full'
                            />
                            <ErrorMessage
                                name='category'
                                component='div'
                                className='text-error text-sm mt-1'
                            />
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
