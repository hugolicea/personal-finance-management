import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import {
    useCreateCategory,
    useUpdateCategory,
} from '../hooks/queries/useCategoriesQuery';
import { Category } from '../types/categories';
import FormAutoSave from './FormAutoSave';

interface CategoryFormProps {
    category?: Category;
    onClose: () => void;
}

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

function CategoryForm({ category, onClose }: CategoryFormProps) {
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();

    const initialValues = {
        name: category?.name || '',
        classification: category?.classification || 'spend',
        monthly_budget: category?.monthly_budget || 0,
    };

    const handleSubmit = async (values: typeof initialValues) => {
        try {
            if (category) {
                await updateCategoryMutation.mutateAsync({
                    id: category.id,
                    name: values.name,
                    classification: values.classification,
                    monthly_budget: values.monthly_budget,
                });
            } else {
                await createCategoryMutation.mutateAsync({
                    name: values.name,
                    classification: values.classification,
                    monthly_budget: values.monthly_budget,
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save category:', error);
        }
    };

    return (
        <div className='w-full'>
            <h2 className='text-xl font-bold mb-4'>
                {category ? 'Edit Category' : 'Add Category'}
            </h2>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form className='space-y-4'>
                        <FormAutoSave
                            formName='category-form'
                            initialValues={initialValues}
                        />
                        <div>
                            <label
                                htmlFor='name'
                                className='block text-sm font-medium mb-1'
                            >
                                Category Name
                            </label>
                            <Field
                                id='name'
                                type='text'
                                name='name'
                                className='input input-bordered w-full'
                                placeholder='Enter category name'
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
                                htmlFor='classification'
                                className='block text-sm font-medium mb-1'
                            >
                                Classification
                            </label>
                            <Field
                                as='select'
                                id='classification'
                                name='classification'
                                className='input input-bordered w-full'
                                aria-describedby={
                                    errors.classification &&
                                    touched.classification
                                        ? 'classification-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.classification &&
                                    touched.classification
                                        ? true
                                        : undefined
                                }
                            >
                                <option value='spend'>Spend</option>
                                <option value='income'>Income</option>
                            </Field>
                            <ErrorMessage name='classification'>
                                {(msg) => (
                                    <span
                                        id='classification-error'
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
                                htmlFor='monthly_budget'
                                className='block text-sm font-medium mb-1'
                            >
                                Monthly Budget ($)
                            </label>
                            <Field
                                id='monthly_budget'
                                type='number'
                                name='monthly_budget'
                                step='0.01'
                                min='0'
                                className='input input-bordered w-full'
                                placeholder='0.00'
                                aria-describedby={
                                    errors.monthly_budget &&
                                    touched.monthly_budget
                                        ? 'monthly_budget-error'
                                        : undefined
                                }
                                aria-invalid={
                                    errors.monthly_budget &&
                                    touched.monthly_budget
                                        ? true
                                        : undefined
                                }
                            />
                            <ErrorMessage name='monthly_budget'>
                                {(msg) => (
                                    <span
                                        id='monthly_budget-error'
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
}

export default CategoryForm;
