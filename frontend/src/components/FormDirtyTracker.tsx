import { useEffect } from 'react';

import { useFormikContext } from 'formik';

import useFormDirty from '../hooks/useFormDirty';

interface FormDirtyTrackerProps<T> {
    initialValues: T;
    formName: string;
    onDirtyChange?: (isDirty: boolean) => void;
}

function FormDirtyTracker<T>({
    initialValues,
    formName,
    onDirtyChange,
}: FormDirtyTrackerProps<T>) {
    const { values, isSubmitting } = useFormikContext<T>();
    const isDirty = useFormDirty(initialValues, values, formName);

    useEffect(() => {
        onDirtyChange?.(isDirty && !isSubmitting);
    }, [isDirty, isSubmitting, onDirtyChange]);

    return null;
}

export default FormDirtyTracker;
