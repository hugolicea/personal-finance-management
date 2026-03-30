import { useEffect } from 'react';

import { useFormikContext } from 'formik';

import useFormDirty from '../hooks/useFormDirty';

interface FormAutoSaveProps {
    formName: string;
    initialValues: object;
    onDirtyChange?: (dirty: boolean) => void;
}

function FormAutoSave({
    formName,
    initialValues,
    onDirtyChange,
}: FormAutoSaveProps) {
    const { values } = useFormikContext<object>();
    const isDirty = useFormDirty(initialValues, values, formName);

    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    return null;
}

export default FormAutoSave;
