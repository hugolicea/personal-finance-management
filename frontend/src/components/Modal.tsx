import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    maxWidth,
}) => {
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className='modal modal-open' onClick={handleBackdropClick}>
            <div
                className={`modal-box max-h-[90vh] overflow-y-auto ${
                    maxWidth ?? 'max-w-2xl'
                } w-full`}
            >
                {title && (
                    <div className='flex items-center justify-between mb-4 pb-4 border-b border-base-300'>
                        <h2 className='text-lg font-medium'>{title}</h2>
                        <button
                            onClick={onClose}
                            className='btn btn-ghost btn-sm btn-circle'
                            aria-label='Close'
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div>{children}</div>
            </div>
            <div className='modal-backdrop' onClick={onClose} />
        </div>
    );
};

export default Modal;
