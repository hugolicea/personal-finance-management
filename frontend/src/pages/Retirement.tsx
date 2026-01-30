import { useEffect, useState } from 'react';

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

    const handleEditRetirementAccount = (
        retirementAccount: RetirementAccount
    ) => {
        setEditingRetirementAccount(retirementAccount);
        setShowRetirementAccountModal(true);
    };

    const handleDeleteRetirementAccount = (
        retirementAccount: RetirementAccount
    ) => {
        setDeletingRetirementAccount(retirementAccount);
        setShowDeleteRetirementAccountDialog(true);
    };

    const confirmDeleteRetirementAccount = async () => {
        if (deletingRetirementAccount) {
            await dispatch(
                deleteRetirementAccount(deletingRetirementAccount.id)
            );
            setShowDeleteRetirementAccountDialog(false);
            setDeletingRetirementAccount(null);
        }
    };

    const closeModal = () => {
        setShowRetirementAccountModal(false);
        setEditingRetirementAccount(null);
    };

    const totalBalance = retirementAccounts.reduce(
        (sum, account) =>
            sum + (parseFloat(String(account.current_balance)) || 0),
        0
    );

    const totalMonthlyContribution = retirementAccounts.reduce(
        (sum, account) =>
            sum + (parseFloat(String(account.monthly_contribution)) || 0),
        0
    );

    const totalAnnualContribution = retirementAccounts.reduce(
        (sum, account) =>
            sum + (parseFloat(String(account.total_annual_contribution)) || 0),
        0
    );

    const getAccountTypeDisplay = (accountType: string) => {
        const types: { [key: string]: string } = {
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
        return types[accountType] || accountType;
    };

    const getRiskLevelDisplay = (riskLevel: string) => {
        const levels: { [key: string]: string } = {
            conservative: 'Conservative',
            moderate: 'Moderate',
            aggressive: 'Aggressive',
            very_aggressive: 'Very Aggressive',
        };
        return levels[riskLevel] || riskLevel;
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
        );
    }

    return (
        <div className='px-4 sm:px-6 lg:px-8'>
            <div className='sm:flex sm:items-center'>
                <div className='sm:flex-auto'>
                    <h1 className='text-2xl font-semibold text-gray-900'>
                        Retirement Accounts
                    </h1>
                    <p className='mt-2 text-sm text-gray-700'>
                        Track and manage your retirement savings accounts
                    </p>
                </div>
            </div>

            {/* Add Account Button - Positioned below the header */}
            <div className='mt-6 flex justify-center sm:justify-start'>
                <button
                    type='button'
                    onClick={() => setShowRetirementAccountModal(true)}
                    className='inline-flex items-center justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200'
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
                <div className='bg-white overflow-hidden shadow rounded-lg'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 text-gray-400'
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
                                    <dt className='text-sm font-medium text-gray-500 truncate'>
                                        Total Balance
                                    </dt>
                                    <dd className='text-lg font-medium text-gray-900'>
                                        {formatCurrency(totalBalance)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-white overflow-hidden shadow rounded-lg'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 text-gray-400'
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
                                    <dt className='text-sm font-medium text-gray-500 truncate'>
                                        Monthly Contributions
                                    </dt>
                                    <dd className='text-lg font-medium text-gray-900'>
                                        {formatCurrency(
                                            totalMonthlyContribution
                                        )}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-white overflow-hidden shadow rounded-lg'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 text-gray-400'
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
                                    <dt className='text-sm font-medium text-gray-500 truncate'>
                                        Annual Contributions
                                    </dt>
                                    <dd className='text-lg font-medium text-gray-900'>
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
                        <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
                            <table className='w-full table-auto divide-y divide-gray-300'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-gray-900'
                                        >
                                            Account
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-gray-900'
                                        >
                                            Type
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-gray-900'
                                        >
                                            Provider
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-gray-900'
                                        >
                                            Balance
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-gray-900'
                                        >
                                            Monthly Contribution
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-4 py-2 text-left text-sm font-semibold text-gray-900'
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
                                <tbody className='divide-y divide-gray-200 bg-white'>
                                    {retirementAccounts.map((account) => (
                                        <tr key={account.id}>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-10 w-10'>
                                                        <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                                                            <svg
                                                                className='h-5 w-5 text-blue-600'
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
                                                        <div className='font-medium text-gray-900'>
                                                            {account.name}
                                                        </div>
                                                        {account.account_number && (
                                                            <div className='text-gray-500'>
                                                                ****
                                                                {
                                                                    account.account_number
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-500'>
                                                {getAccountTypeDisplay(
                                                    account.account_type
                                                )}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-500'>
                                                {account.provider}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-900'>
                                                {formatCurrency(
                                                    account.current_balance
                                                )}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-900'>
                                                {formatCurrency(
                                                    account.monthly_contribution
                                                )}
                                            </td>
                                            <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-500'>
                                                {getRiskLevelDisplay(
                                                    account.risk_level
                                                )}
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
                onClose={() =>
                    !deleting && setShowDeleteRetirementAccountDialog(false)
                }
                onConfirm={confirmDeleteRetirementAccount}
                title='Delete Retirement Account'
                message={
                    <>
                        <p className='text-sm text-gray-500'>
                            You are about to permanently delete the retirement
                            account{' '}
                            <span className='font-semibold text-gray-700'>
                                "{deletingRetirementAccount?.name}"
                            </span>
                            . This action cannot be undone.
                        </p>
                        {deletingRetirementAccount && (
                            <div className='mt-3 p-3 bg-gray-50 rounded-md'>
                                <div className='text-sm'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <span className='font-medium text-gray-700'>
                                                Provider:
                                            </span>{' '}
                                            <span className='text-gray-900'>
                                                {
                                                    deletingRetirementAccount.provider
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className='font-medium text-gray-700'>
                                                Type:
                                            </span>{' '}
                                            <span className='text-gray-900 capitalize'>
                                                {deletingRetirementAccount.account_type.replace(
                                                    '_',
                                                    ' '
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='font-medium text-gray-700'>
                                                Current Balance:
                                            </span>{' '}
                                            <span className='text-gray-900 font-semibold'>
                                                {formatCurrency(
                                                    deletingRetirementAccount.current_balance
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='font-medium text-gray-700'>
                                                Monthly Contribution:
                                            </span>{' '}
                                            <span className='text-gray-900'>
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
                            <p className='text-sm text-red-600 font-medium'>
                                ⚠️ This will permanently remove all data
                                associated with this retirement account.
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
