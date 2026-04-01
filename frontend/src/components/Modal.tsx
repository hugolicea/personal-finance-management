import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '../hooks/useFocusTrap';
import ConfirmModal from './ConfirmModal';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    maxWidth?: string;
    isDirty?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    maxWidth,
    isDirty = false,
}) => {
    const [showDirtyWarning, setShowDirtyWarning] = useState(false);
    const containerRef = useFocusTrap(isOpen);

    const handleRequestClose = useCallback(() => {
        if (isDirty) {
            setShowDirtyWarning(true);
            return;
        }

        onClose();
    }, [isDirty, onClose]);

    const handleConfirmClose = useCallback(() => {
        setShowDirtyWarning(false);
        onClose();
    }, [onClose]);

    const handleCancelDirtyWarning = useCallback(() => {
        setShowDirtyWarning(false);
    }, []);

    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleRequestClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, handleRequestClose]);

    useEffect(() => {
        if (!isOpen) {
            setShowDirtyWarning(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleRequestClose();
        }
    };

    return createPortal(
        <>
            <div className='modal modal-open' onClick={handleBackdropClick}>
                <div
                    ref={containerRef}
                    className={`modal-box max-h-[90vh] overflow-y-auto ${
                        maxWidth ?? 'max-w-2xl'
                    } w-full`}
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='modal-title'
                    tabIndex={-1}
                >
                    {title && (
                        <div className='flex items-center justify-between mb-4 pb-4 border-b border-base-300'>
                            <h2
                                id='modal-title'
                                className='text-lg font-medium'
                            >
                                {title}
                            </h2>
                            <button
                                onClick={handleRequestClose}
                                className='btn btn-ghost btn-sm btn-circle'
                                aria-label='Close'
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <div>{children}</div>
                </div>
            </div>
            <ConfirmModal
                isOpen={showDirtyWarning}
                onClose={handleCancelDirtyWarning}
                onConfirm={handleConfirmClose}
                title='Unsaved Changes'
                message='You have unsaved changes. If you close now, your changes will be lost.'
                confirmLabel='Close'
                cancelLabel='Keep editing'
            />
        </>,
        document.body
    );
};

export default Modal;
