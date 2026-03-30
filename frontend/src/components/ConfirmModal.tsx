import React from 'react';

import Modal from './Modal';

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    isConfirming?: boolean;
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm',
    message = 'Are you sure? This action cannot be undone.',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    isDanger = true,
    isConfirming = false,
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className='text-sm opacity-70 mb-6'>{message}</div>
            <div className='flex justify-end gap-3'>
                <button
                    type='button'
                    onClick={onClose}
                    className='btn btn-ghost btn-sm'
                >
                    {cancelLabel}
                </button>
                <button
                    type='button'
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className={`btn btn-sm ${
                        isDanger ? 'btn-error' : 'btn-primary'
                    } ${isConfirming ? 'loading' : ''}`}
                >
                    {isConfirming ? 'Processing...' : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
