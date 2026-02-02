import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '../hooks/redux';
import {
    createCategory,
    updateCategory,
} from '../store/slices/categoriesSlice';
import { Category } from '../types/categories';

interface CategoryFormProps {
    category?: Category;
    onClose: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onClose }) => {
    const dispatch = useAppDispatch();

    const initialValues = {
        name: category?.name || '',
        classification: category?.classification || 'spend',
        monthly_budget: category?.monthly_budget || 0,
    };

    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Category name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be less than 50 characters'),
        classification: Yup.string()
            .oneOf(['spend', 'income'], 'Invalid classification')
            .required('Classification is required'),
        monthly_budget: Yup.number()
            .min(0, 'Budget must be positive')
            .required('Monthly budget is required'),
    });

    const handleSubmit = async (values: typeof initialValues) => {
        try {
            if (category) {
                await dispatch(
                    updateCategory({
                        id: category.id,
                        name: values.name,
                        classification: values.classification,
                        monthly_budget: values.monthly_budget,
                    })
                ).unwrap();
            } else {
                await dispatch(
                    createCategory({
                        name: values.name,
                        classification: values.classification,
                        monthly_budget: values.monthly_budget,
                    })
                ).unwrap();
            }
            onClose();
        } catch (error) {
            console.error('Failed to save category:', error);
        }
    };

    return (
        <div className='bg-white p-6 rounded-lg shadow-lg max-w-md w-full'>
            <h2 className='text-xl font-bold mb-4'>
                {category ? 'Edit Category' : 'Add Category'}
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
                                Category Name
                            </label>
                            <Field
                                type='text'
                                name='name'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Enter category name'
                            />
                            <ErrorMessage
                                name='name'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='classification'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Classification
                            </label>
                            <Field
                                as='select'
                                name='classification'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='spend'>Spend</option>
                                <option value='income'>Income</option>
                            </Field>
                            <ErrorMessage
                                name='classification'
                                component='div'
                                className='text-red-500 text-sm mt-1'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='monthly_budget'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Monthly Budget ($)
                            </label>
                            <Field
                                type='number'
                                name='monthly_budget'
                                step='0.01'
                                min='0'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='0.00'
                            />
                            <ErrorMessage
                                name='monthly_budget'
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
                                    : category
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

export default CategoryForm;
