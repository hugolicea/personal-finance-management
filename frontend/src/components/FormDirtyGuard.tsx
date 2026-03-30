import React from 'react';

interface FormDirtyGuardProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const FormDirtyGuard: React.FC<FormDirtyGuardProps> = ({
    isOpen,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='unsaved-changes-title'
            aria-describedby='unsaved-changes-description'
        >
            <div className='w-full max-w-md rounded-lg bg-base-100 p-6 shadow-xl'>
                <h3
                    id='unsaved-changes-title'
                    className='text-lg font-semibold'
                >
                    Unsaved Changes
                </h3>
                <p
                    id='unsaved-changes-description'
                    className='mt-2 text-sm text-secondary-data'
                >
                    You have unsaved changes. Are you sure?
                </p>
                <div className='mt-6 flex justify-end gap-tight'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='btn-secondary-action'
                        autoFocus
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className='btn-secondary-action'
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormDirtyGuard;
