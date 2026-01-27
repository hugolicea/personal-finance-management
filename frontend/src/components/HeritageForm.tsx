import React from 'react';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '../hooks/redux';
import { createHeritage, updateHeritage } from '../store/slices/heritagesSlice';

interface HeritageFormProps {
    heritage?: {
        id: number;
        name: string;
        heritage_type: string;
        address: string;
        area: number | null;
        area_unit: string;
        purchase_price: number;
        current_value: number | null;
        purchase_date: string;
        monthly_rental_income: number;
        notes: string | null;
    };
    onClose: () => void;
}

const HeritageForm: React.FC<HeritageFormProps> = ({ heritage, onClose }) => {
    const dispatch = useAppDispatch();

    const initialValues = {
        name: heritage?.name || '',
        heritage_type: heritage?.heritage_type || 'house',
        address: heritage?.address || '',
        area: heritage?.area || '',
        area_unit: heritage?.area_unit || 'sq_m',
        purchase_price: heritage?.purchase_price || 0,
        current_value: heritage?.current_value || '',
        purchase_date:
            heritage?.purchase_date || new Date().toISOString().split('T')[0],
        monthly_rental_income: heritage?.monthly_rental_income || 0,
        notes: heritage?.notes || '',
    };

    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Property name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(200, 'Name must be less than 200 characters'),
        heritage_type: Yup.string()
            .oneOf(
                [
                    'land',
                    'house',
                    'apartment',
                    'commercial',
                    'office',
                    'warehouse',
                    'other',
                ],
                'Invalid property type'
            )
            .required('Property type is required'),
        address: Yup.string()
            .required('Address is required')
            .min(5, 'Address must be at least 5 characters'),
        area: Yup.number().positive('Area must be positive').nullable(),
        area_unit: Yup.string().max(
            20,
            'Area unit must be less than 20 characters'
        ),
        purchase_price: Yup.number()
            .positive('Purchase price must be positive')
            .required('Purchase price is required'),
        current_value: Yup.number()
            .positive('Current value must be positive')
            .nullable(),
        purchase_date: Yup.date()
            .required('Purchase date is required')
            .max(new Date(), 'Purchase date cannot be in the future'),
        monthly_rental_income: Yup.number()
            .min(0, 'Rental income cannot be negative')
            .required('Monthly rental income is required'),
        notes: Yup.string().max(500, 'Notes must be less than 500 characters'),
    });

    const handleSubmit = async (values: typeof initialValues) => {
        try {
            const data = {
                ...values,
                area: values.area === '' ? null : Number(values.area),
                current_value:
                    values.current_value === ''
                        ? null
                        : Number(values.current_value),
                purchase_price: Number(values.purchase_price),
                monthly_rental_income: Number(values.monthly_rental_income),
            };

            if (heritage) {
                await dispatch(
                    updateHeritage({
                        id: heritage.id,
                        data,
                    })
                );
            } else {
                await dispatch(createHeritage(data));
            }
            onClose();
        } catch (error) {
            console.error('Error saving heritage:', error);
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
                    {/* Property Information Section */}
                    <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
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
                                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                    />
                                </svg>
                            </div>
                            <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                Property Information
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='name'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Property Name{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    type='text'
                                    name='name'
                                    id='name'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                    placeholder='e.g., Downtown Apartment, Family House'
                                />
                                <ErrorMessage
                                    name='name'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='heritage_type'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Property Type{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    as='select'
                                    name='heritage_type'
                                    id='heritage_type'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                >
                                    <option value='land'>🌄 Land</option>
                                    <option value='house'>🏠 House</option>
                                    <option value='apartment'>
                                        🏢 Apartment
                                    </option>
                                    <option value='commercial'>
                                        🏬 Commercial Property
                                    </option>
                                    <option value='office'>🏢 Office</option>
                                    <option value='warehouse'>
                                        🏭 Warehouse
                                    </option>
                                    <option value='other'>🏗️ Other</option>
                                </Field>
                                <ErrorMessage
                                    name='heritage_type'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='purchase_date'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Purchase Date{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    type='date'
                                    name='purchase_date'
                                    id='purchase_date'
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                />
                                <ErrorMessage
                                    name='purchase_date'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div className='sm:col-span-2'>
                                <label
                                    htmlFor='address'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Property Address{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <Field
                                    as='textarea'
                                    name='address'
                                    id='address'
                                    rows={3}
                                    className='block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white resize-none'
                                    placeholder='Full address including street, city, state, and postal code'
                                />
                                <ErrorMessage
                                    name='address'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Details Section */}
                    <div className='bg-blue-50 rounded-lg p-6 border border-blue-200'>
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
                                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                    />
                                </svg>
                            </div>
                            <h3 className='ml-3 text-lg font-medium text-gray-900'>
                                Property Details
                            </h3>
                        </div>

                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                            <div>
                                <label
                                    htmlFor='area'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Area Size
                                </label>
                                <div className='flex'>
                                    <Field
                                        type='number'
                                        name='area'
                                        id='area'
                                        step='any'
                                        className='block w-full px-4 py-3 border-2 border-gray-200 rounded-l-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='200'
                                    />
                                    <Field
                                        as='select'
                                        name='area_unit'
                                        className='px-3 py-3 border-2 border-l-0 border-gray-200 rounded-r-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white min-w-[100px]'
                                    >
                                        <option value='sq_m'>sq m</option>
                                        <option value='sq_ft'>sq ft</option>
                                        <option value='acres'>acres</option>
                                        <option value='hectares'>
                                            hectares
                                        </option>
                                    </Field>
                                </div>
                                <p className='mt-2 text-xs text-gray-500 font-medium'>
                                    Optional - leave empty if not applicable
                                </p>
                                <ErrorMessage
                                    name='area'
                                    component='div'
                                    className='mt-1 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='monthly_rental_income'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Monthly Rental Income{' '}
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
                                        name='monthly_rental_income'
                                        id='monthly_rental_income'
                                        step='any'
                                        className='block w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='0'
                                    />
                                </div>
                                <p className='mt-2 text-xs text-gray-500 font-medium'>
                                    Set to 0 if property is not rented
                                </p>
                                <ErrorMessage
                                    name='monthly_rental_income'
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
                                    htmlFor='purchase_price'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Purchase Price{' '}
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
                                        name='purchase_price'
                                        id='purchase_price'
                                        step='any'
                                        className='block w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='250000'
                                    />
                                </div>
                                <ErrorMessage
                                    name='purchase_price'
                                    component='div'
                                    className='mt-2 text-sm text-red-600 font-medium'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='current_value'
                                    className='block text-sm font-semibold text-gray-800 mb-2'
                                >
                                    Current Market Value
                                </label>
                                <div className='relative'>
                                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                        <span className='text-gray-500 sm:text-sm font-medium'>
                                            $
                                        </span>
                                    </div>
                                    <Field
                                        type='number'
                                        name='current_value'
                                        id='current_value'
                                        step='any'
                                        className='block w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 sm:text-sm bg-white'
                                        placeholder='275000'
                                    />
                                </div>
                                <p className='mt-2 text-xs text-gray-500 font-medium'>
                                    Optional - for tracking property
                                    appreciation
                                </p>
                                <ErrorMessage
                                    name='current_value'
                                    component='div'
                                    className='mt-1 text-sm text-red-600 font-medium'
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
                                placeholder='Any additional information about this property (renovations, special features, etc.)'
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
                            className='w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border-2 border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
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
                                    {heritage
                                        ? 'Update Property'
                                        : 'Add Property'}
                                </>
                            )}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default HeritageForm;
