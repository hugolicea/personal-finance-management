import React, { useState } from 'react';

import Modal from './Modal';
import TransactionForm from './TransactionForm';

const FloatingActionButton: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [isTransactionFormDirty, setIsTransactionFormDirty] = useState(false);

    const closeModal = () => {
        setShowModal(false);
        setIsTransactionFormDirty(false);
    };

    return (
        <>
            <button
                onClick={() => {
                    setIsTransactionFormDirty(false);
                    setShowModal(true);
                }}
                className='btn-primary-action fixed bottom-6 right-6 shadow-xl z-50 hover:scale-110 transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                aria-label='Add Transaction'
                type='button'
            >
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    aria-hidden='true'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                    />
                </svg>
            </button>

            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title='Add Transaction'
                    isDirty={isTransactionFormDirty}
                >
                    <TransactionForm
                        onClose={closeModal}
                        onDirtyChange={setIsTransactionFormDirty}
                    />
                </Modal>
            )}
        </>
    );
};

export default FloatingActionButton;
