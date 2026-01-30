import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    createTransaction,
    updateTransaction,
} from '../store/slices/transactionsSlice';

interface TransactionFormProps {
    transaction?: {
        id: number;
        amount: number;
        description: string;
        date: string;
        category: number;
    };
    onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
    transaction,
    onClose,
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
        date: transaction?.date || new Date().toISOString().split('T')[0],
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

            if (transaction) {
                await dispatch(
                    updateTransaction({
                        id: transaction.id,
                        ...values,
                        amount: String(amount),
                        category: Number(values.category),
                    })
                ).unwrap();
            } else {
                await dispatch(
                    createTransaction({
                        ...values,
                        amount: String(amount),
                        category: Number(values.category),
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
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
        );
    }

    return (
        <div className='bg-white p-6 rounded-lg shadow-lg max-w-md w-full'>
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
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Type
                            </label>
                            <Field
                                as='select'
                                name='type'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='expense'>Expense</option>
                                <option value='income'>Income</option>
                            </Field>
                            <ErrorMessage
                                name='type'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='amount'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Amount
                            </label>
                            <Field
                                type='number'
                                name='amount'
                                step='0.01'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='0.00'
                            />
                            <ErrorMessage
                                name='amount'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='description'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Description
                            </label>
                            <Field
                                type='text'
                                name='description'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Transaction description'
                            />
                            <ErrorMessage
                                name='description'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='date'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Date
                            </label>
                            <Field
                                type='date'
                                name='date'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                            <ErrorMessage
                                name='date'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='category'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Category
                            </label>
                            <Field
                                as='select'
                                name='category'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value=''>Select a category</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </Field>
                            <ErrorMessage
                                name='category'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div className='flex justify-end space-x-3 pt-4'>
                            <button
                                type='button'
                                onClick={onClose}
                                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
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
