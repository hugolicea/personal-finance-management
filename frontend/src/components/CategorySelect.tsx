import React, { useMemo } from 'react';

import { FieldInputProps } from 'formik';

import { Category } from '../types/categories';
import sortCategories from '../utils/sortCategories';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
    categories: Category[];
    placeholder?: string; // first option label, value will be empty string
    field?: FieldInputProps<string | number>; // support Formik Field (receives { field, form, meta })
};

const defaultClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function CategorySelect({
    categories,
    placeholder,
    field,
    className,
    ...rest
}: Props) {
    const sorted = useMemo(() => sortCategories(categories), [categories]);

    // If used with Formik Field, it will pass `field` prop containing name, value, onChange
    const selectProps = field ? { ...(field as object) } : {};

    return (
        <select
            {...selectProps}
            {...rest}
            className={className ?? defaultClass}
        >
            {placeholder && <option value=''>{placeholder}</option>}
            {sorted.map((category) => (
                <option key={category.id} value={category.id}>
                    {category.name}
                </option>
            ))}
        </select>
    );
}
