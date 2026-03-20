import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AccountForm from '../components/AccountForm';
import ConfirmModal from '../components/ConfirmModal';
import EditDeleteIconButtons from '../components/EditDeleteIconButtons';
import Modal from '../components/Modal';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { deleteAccount, fetchAccounts } from '../store/slices/accountsSlice';
import type { BankAccount } from '../types/accounts';
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from '../types/accounts';
import { formatCurrency } from '../utils/formatters';

function AccountsList() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { accounts, loading, deleting } = useAppSelector(
        (state) => state.accounts
    );

    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
        null
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingAccountItem, setDeletingAccountItem] =
        useState<BankAccount | null>(null);

    useEffect(() => {
        dispatch(fetchAccounts());
    }, [dispatch]);

    const handleEdit = (account: BankAccount) => {
        setEditingAccount(account);
        setShowModal(true);
    };

    const handleDeleteRequest = (account: BankAccount) => {
        setDeletingAccountItem(account);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingAccountItem) return;
        await dispatch(deleteAccount(deletingAccountItem.id));
        setShowDeleteDialog(false);
        setDeletingAccountItem(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex justify-between items-center'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        Bank Accounts
                    </h1>
                    <p className='text-gray-500 text-sm mt-1'>
                        {accounts.length} account
                        {accounts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2'
                >
                    <span className='text-lg'>+</span> Add Account
                </button>
            </div>

            {/* Account grid */}
            {accounts.length === 0 ? (
                <div className='text-center py-16 bg-white rounded-lg shadow'>
                    <p className='text-5xl mb-4'>🏦</p>
                    <p className='text-gray-500 text-lg'>No accounts yet.</p>
                    <p className='text-gray-400 text-sm mt-1'>
                        Add a bank account to start tracking transactions.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className='mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors'
                    >
                        Add Account
                    </button>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 relative ${
                                account.is_active
                                    ? 'border-blue-500'
                                    : 'border-gray-300 opacity-60'
                            }`}
                        >
                            <button
                                type='button'
                                className='w-full text-left p-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-lg'
                                onClick={() =>
                                    navigate(`/accounts/${account.id}`)
                                }
                                aria-label={`View transactions for ${account.name}`}
                            >
                                <div className='flex justify-between items-start mb-3'>
                                    <div className='flex items-center gap-2'>
                                        <span
                                            className='text-2xl'
                                            aria-hidden='true'
                                        >
                                            {ACCOUNT_TYPE_ICONS[
                                                account.account_type
                                            ] ?? '🏛️'}
                                        </span>
                                        <div>
                                            <h3 className='font-semibold text-gray-900 text-sm leading-tight truncate max-w-[140px]'>
                                                {account.name}
                                            </h3>
                                            <p className='text-xs text-gray-500'>
                                                {ACCOUNT_TYPE_LABELS[
                                                    account.account_type
                                                ] ?? account.account_type}
                                                {account.account_number && (
                                                    <span className='ml-1'>
                                                        ••••{' '}
                                                        {account.account_number.slice(
                                                            -4
                                                        )}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {account.institution && (
                                    <p className='text-xs text-gray-500 mb-2'>
                                        <span aria-hidden='true'>🏛️</span>{' '}
                                        {account.institution}
                                    </p>
                                )}

                                <div className='border-t pt-2 mt-2'>
                                    <p className='text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide'>
                                        This month
                                    </p>
                                    <div className='flex justify-between items-center'>
                                        <div>
                                            <p className='text-xs text-gray-500'>
                                                Balance
                                            </p>
                                            <p
                                                className={`font-bold text-sm ${
                                                    account.current_month_balance >=
                                                    0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {formatCurrency(
                                                    account.current_month_balance
                                                )}
                                            </p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='text-xs text-gray-500'>
                                                Transactions
                                            </p>
                                            <p className='font-semibold text-gray-700 text-sm'>
                                                {account.current_month_count}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            {/* Edit/Delete overlay — outside the nav button */}
                            <div className='absolute top-3 right-3'>
                                <EditDeleteIconButtons
                                    onEdit={() => handleEdit(account)}
                                    onDelete={() =>
                                        handleDeleteRequest(account)
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit modal */}
            <Modal isOpen={showModal} onClose={closeModal}>
                <AccountForm
                    account={editingAccount ?? undefined}
                    onClose={closeModal}
                />
            </Modal>

            {/* Delete confirmation */}
            {showDeleteDialog && deletingAccountItem && (
                <ConfirmModal
                    isOpen={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setDeletingAccountItem(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title='Delete Account'
                    message={`Are you sure you want to delete "${deletingAccountItem.name}"? This will not delete its transactions.`}
                    isConfirming={deleting}
                />
            )}
        </div>
    );
}

export default AccountsList;
