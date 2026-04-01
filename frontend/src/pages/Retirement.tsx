import { useCallback, useEffect, useMemo, useState } from 'react';

import ConfirmModal from '../components/ConfirmModal';
import EditDeleteButtons from '../components/EditDeleteButtons';
import Modal from '../components/Modal';
import RetirementAccountForm from '../components/RetirementAccountForm';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteRetirementAccount,
    fetchRetirementAccounts,
} from '../store/slices/retirementAccountsSlice';
import { formatCurrency } from '../utils/formatters';

interface RetirementAccount {
    id: number;
    name: string;
    account_type: string;
    provider: string;
    account_number: string | null;
    current_balance: number;
    monthly_contribution: number;
    employer_match_percentage: number;
    employer_match_limit: number;
    risk_level: string;
    target_retirement_age: number;
    notes: string | null;
    annual_contribution: number;
    employer_match_amount: number;
    total_annual_contribution: number;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    traditional_401k: 'Traditional 401(k)',
    roth_401k: 'Roth 401(k)',
    traditional_ira: 'Traditional IRA',
    roth_ira: 'Roth IRA',
    sep_ira: 'SEP IRA',
    simple_ira: 'SIMPLE IRA',
    pension: 'Pension',
    annuity: 'Annuity',
    other: 'Other',
};

const RISK_LEVEL_LABELS: Record<string, string> = {
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive',
    very_aggressive: 'Very Aggressive',
};

function Retirement() {
    const dispatch = useAppDispatch();
    const { retirementAccounts, loading, deleting } = useAppSelector(
        (state) => state.retirementAccounts
    );

    const [showRetirementAccountModal, setShowRetirementAccountModal] =
        useState(false);
    const [editingRetirementAccount, setEditingRetirementAccount] =
        useState<RetirementAccount | null>(null);
    const [
        showDeleteRetirementAccountDialog,
        setShowDeleteRetirementAccountDialog,
    ] = useState(false);
    const [deletingRetirementAccount, setDeletingRetirementAccount] =
        useState<RetirementAccount | null>(null);

    useEffect(() => {
        dispatch(fetchRetirementAccounts());
    }, [dispatch]);

    const handleEditRetirementAccount = useCallback(
        (retirementAccount: RetirementAccount) => {
            setEditingRetirementAccount(retirementAccount);
            setShowRetirementAccountModal(true);
        },
        []
    );

    const handleDeleteRetirementAccount = useCallback(
        (retirementAccount: RetirementAccount) => {
            setDeletingRetirementAccount(retirementAccount);
            setShowDeleteRetirementAccountDialog(true);
        },
        []
    );

    const confirmDeleteRetirementAccount = useCallback(async () => {
        if (deletingRetirementAccount) {
            await dispatch(
                deleteRetirementAccount(deletingRetirementAccount.id)
            );
            setShowDeleteRetirementAccountDialog(false);
            setDeletingRetirementAccount(null);
        }
    }, [deletingRetirementAccount, dispatch]);

    const closeModal = useCallback(() => {
        setShowRetirementAccountModal(false);
        setEditingRetirementAccount(null);
    }, []);

    const handleOpenModal = useCallback(() => {
        setShowRetirementAccountModal(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        if (!deleting) setShowDeleteRetirementAccountDialog(false);
    }, [deleting]);

    // Single-pass totals
    const { totalBalance, totalMonthlyContribution, totalAnnualContribution } =
        useMemo(() => {
            let balance = 0;
            let monthly = 0;
            let annual = 0;
            for (const account of retirementAccounts) {
                balance += parseFloat(String(account.current_balance)) || 0;
                monthly +=
                    parseFloat(String(account.monthly_contribution)) || 0;
                annual +=
                    parseFloat(String(account.total_annual_contribution)) || 0;
            }
            return {
                totalBalance: balance,
                totalMonthlyContribution: monthly,
                totalAnnualContribution: annual,
            };
        }, [retirementAccounts]);

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <div className='loading loading-spinner loading-lg text-primary'></div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='sm:flex sm:items-center'>
                <div className='sm:flex-auto'>
                    <h1 className='text-2xl font-semibold'>
                        Retirement Accounts
                    </h1>
                    <p className='mt-2 text-sm opacity-70'>
                        Track and manage your retirement savings accounts
                    </p>
                </div>
            </div>

            {/* Add Account Button - Positioned below the header */}
            <div className='mt-6 flex justify-center sm:justify-start'>
                <button
                    type='button'
                    onClick={handleOpenModal}
                    className='btn btn-primary'
                >
                    <svg
                        className='-ml-1 mr-3 h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                        />
                    </svg>
                    Add Retirement Account
                </button>
            </div>

            {/* Summary Cards */}
            <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                <div className='card bg-base-100 shadow-sm'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 opacity-40'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Total Balance
                                    </dt>
                                    <dd className='text-lg font-medium tabular-nums'>
                                        {formatCurrency(totalBalance)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='card bg-base-100 shadow-sm'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 opacity-40'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M7 12l3-3 3 3 4-4'
                                    />
                                </svg>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Monthly Contributions
                                    </dt>
                                    <dd className='text-lg font-medium tabular-nums'>
                                        {formatCurrency(
                                            totalMonthlyContribution
                                        )}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='card bg-base-100 shadow-sm'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 opacity-40'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                    />
                                </svg>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Annual Contributions
                                    </dt>
                                    <dd className='text-lg font-medium tabular-nums'>
                                        {formatCurrency(
                                            totalAnnualContribution
                                        )}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Retirement Accounts Table */}
            <div className='mt-8 flex flex-col'>
                <div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
                    <div className='inline-block w-full py-2 align-middle md:px-6 lg:px-8'>
                        <div className='overflow-hidden rounded-lg shadow-sm'>
                            <table className='table table-zebra w-full'>
                                <thead className='sticky top-0 bg-base-100 z-10 shadow-sm'>
                                    <tr>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-base-content'
                                        >
                                            Account
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-base-content'
                                        >
                                            Type
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-base-content'
                                        >
                                            Provider
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-base-content'
                                        >
                                            Balance
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-base-content'
                                        >
                                            Monthly Contribution
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-base-content'
                                        >
                                            Risk Level
                                        </th>
                                        <th
                                            scope='col'
                                            className='relative px-4 py-2'
                                        >
                                            <span className='sr-only'>
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {retirementAccounts.map((account) => (
                                        <tr key={account.id}>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-10 w-10'>
                                                        <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                                                            <svg
                                                                className='h-5 w-5 text-primary'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <path
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className='ml-4'>
                                                        <div className='font-medium text-base-content'>
                                                            {account.name}
                                                        </div>
                                                        {account.account_number && (
                                                            <div className='text-base-content/60'>
                                                                ****
                                                                {
                                                                    account.account_number
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-base-content/60'>
                                                {ACCOUNT_TYPE_LABELS[
                                                    account.account_type
                                                ] ?? account.account_type}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-base-content/60'>
                                                {account.provider}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-base-content tabular-nums'>
                                                {formatCurrency(
                                                    account.current_balance
                                                )}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-base-content tabular-nums'>
                                                {formatCurrency(
                                                    account.monthly_contribution
                                                )}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-base-content/60'>
                                                {RISK_LEVEL_LABELS[
                                                    account.risk_level
                                                ] ?? account.risk_level}
                                            </td>
                                            <td className='relative whitespace-nowrap px-4 py-2 text-right text-sm font-medium'>
                                                <EditDeleteButtons
                                                    onEdit={() =>
                                                        handleEditRetirementAccount(
                                                            account
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        handleDeleteRetirementAccount(
                                                            account
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showRetirementAccountModal}
                onClose={closeModal}
                title={
                    editingRetirementAccount
                        ? 'Edit Retirement Account'
                        : 'Add Retirement Account'
                }
            >
                <RetirementAccountForm
                    retirementAccount={editingRetirementAccount ?? undefined}
                    onClose={closeModal}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteRetirementAccountDialog}
                onClose={handleCloseDeleteModal}
                onConfirm={confirmDeleteRetirementAccount}
                title='Delete Retirement Account'
                message={
                    <>
                        <p className='text-sm text-base-content/60'>
                            You are about to permanently delete the retirement
                            account{' '}
                            <span className='font-semibold text-base-content/80'>
                                "{deletingRetirementAccount?.name}"
                            </span>
                            . This action cannot be undone.
                        </p>
                        {deletingRetirementAccount && (
                            <div className='mt-3 p-3 bg-base-200 rounded-md'>
                                <div className='text-sm'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <span className='font-medium'>
                                                Provider:
                                            </span>{' '}
                                            <span className='text-base-content'>
                                                {
                                                    deletingRetirementAccount.provider
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className='font-medium'>
                                                Type:
                                            </span>{' '}
                                            <span className='text-base-content capitalize'>
                                                {deletingRetirementAccount.account_type.replace(
                                                    /_/g,
                                                    ' '
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='font-medium'>
                                                Current Balance:
                                            </span>{' '}
                                            <span className='text-base-content font-semibold tabular-nums'>
                                                {formatCurrency(
                                                    deletingRetirementAccount.current_balance
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='font-medium'>
                                                Monthly Contribution:
                                            </span>{' '}
                                            <span className='text-base-content tabular-nums'>
                                                {formatCurrency(
                                                    deletingRetirementAccount.monthly_contribution
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className='mt-3'>
                            <p className='text-sm text-error font-medium'>
                                <span aria-hidden='true'>?? </span>This will
                                permanently remove all data associated with this
                                retirement account.
                            </p>
                        </div>
                    </>
                }
                confirmLabel={deleting ? 'Deleting...' : 'Delete Account'}
                cancelLabel='Cancel'
                isDanger
                isConfirming={deleting}
            />
        </div>
    );
}

export default Retirement;
