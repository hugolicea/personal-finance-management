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
            <div className='text-sm text-gray-600 mb-6'>{message}</div>
            <div className='flex justify-end space-x-3'>
                <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200'
                >
                    {cancelLabel}
                </button>
                <button
                    type='button'
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isDanger
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    } ${isConfirming ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isConfirming ? 'Processing...' : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
