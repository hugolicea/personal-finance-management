import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
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
        <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={handleBackdropClick}
        >
            <div className='bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto max-w-2xl w-full mx-4'>
                {title && (
                    <div className='px-6 py-4 border-b border-gray-200'>
                        <h2 className='text-lg font-medium text-gray-900'>
                            {title}
                        </h2>
                    </div>
                )}
                <div className='px-6 py-4'>{children}</div>
            </div>
        </div>
    );
};

export default Modal;
