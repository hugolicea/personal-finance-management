import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BankStatementUpload from '../components/BankStatementUpload';
import CategorySelect from '../components/CategorySelect';
import ConfirmModal from '../components/ConfirmModal';
import EditDeleteIconButtons from '../components/EditDeleteIconButtons';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    deleteTransaction,
    fetchTransactions,
} from '../store/slices/transactionsSlice';
import { ACCOUNT_TYPE_ICONS } from '../types/accounts';
import type { Transaction } from '../types/transactions';
import { formatDateForDisplay } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';

function AccountTransactionsPage() {
    const { accountId } = useParams<{ accountId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { accounts } = useAppSelector((state) => state.accounts);
    const { categories } = useAppSelector((state) => state.categories);
    const {
        transactions,
        loading: transactionsLoading,
        deleting,
    } = useAppSelector((state) => state.transactions);

    const accountIdNum = accountId ? parseInt(accountId) : null;
    const account = accounts.find((a) => a.id === accountIdNum);

    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] =
        useState<Transaction | null>(null);
    const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
        useState(false);
    const [deletingTransaction, setDeletingTransaction] =
        useState<Transaction | null>(null);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
        []
    );

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [filterByYear, setFilterByYear] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    const activeFilterCount = [
        searchTerm !== '',
        selectedCategory !== '',
        filterByYear,
    ].filter(Boolean).length;

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setFilterByYear(false);
        setSelectedYear(new Date().getFullYear());
        setSelectedMonth(new Date().getMonth() + 1);
    };

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchAccounts());
    }, [dispatch]);

    // Re-fetch transactions when filters or account changes
    useEffect(() => {
        if (!accountIdNum) return;

        const dateAfter = filterByYear
            ? `${selectedYear}-01-01`
            : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

        const lastDay = new Date(
            filterByYear ? selectedYear : selectedYear,
            filterByYear ? 12 : selectedMonth,
            0
        ).getDate();
        const dateBefore = `${
            filterByYear ? selectedYear : selectedYear
        }-${String(filterByYear ? 12 : selectedMonth).padStart(
            2,
            '0'
        )}-${String(lastDay).padStart(2, '0')}`;

        dispatch(
            fetchTransactions({
                account: accountIdNum,
                category: selectedCategory || undefined,
                search: searchTerm || undefined,
                date_after: dateAfter,
                date_before: dateBefore,
                ordering: '-date',
            })
        );
    }, [
        dispatch,
        accountIdNum,
        filterByYear,
        selectedYear,
        selectedMonth,
        selectedCategory,
        searchTerm,
    ]);

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowTransactionModal(true);
    };

    const handleDeleteRequest = (transaction: Transaction) => {
        setDeletingTransaction(transaction);
        setShowDeleteTransactionDialog(true);
    };

    const confirmDeleteTransaction = async () => {
        if (!deletingTransaction) return;
        try {
            await dispatch(deleteTransaction(deletingTransaction.id)).unwrap();
            setShowDeleteTransactionDialog(false);
            setDeletingTransaction(null);
        } catch (error) {
            console.error('Failed to delete transaction:', error);
        }
    };

    const handleSelectTransaction = (id: number, checked: boolean) => {
        setSelectedTransactions((prev) =>
            checked ? [...prev, id] : prev.filter((x) => x !== id)
        );
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedTransactions(
            checked ? filteredTransactions.map((t) => t.id) : []
        );
    };

    const confirmBulkDelete = async () => {
        setIsDeleting(true);
        try {
            await Promise.all(
                selectedTransactions.map((id) =>
                    dispatch(deleteTransaction(id)).unwrap()
                )
            );
            setSelectedTransactions([]);
            setShowBulkDeleteDialog(false);
        } catch (error) {
            console.error('Bulk delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTransactions = transactions.filter((t) => !isNaN(t.amount));
    const spendTransactions = filteredTransactions.filter((t) => t.amount < 0);
    const incomeTransactions = filteredTransactions.filter(
        (t) => t.amount >= 0
    );
    const totalSpends = spendTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
    );
    const totalIncomes = incomeTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
    );
    const totalAmount = filteredTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
    );

    // O(1) category lookups — build once when categories change (js-index-maps)
    const categoryMap = useMemo(
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories]
    );
    const getCategoryName = (categoryId: number) =>
        categoryMap.get(categoryId) ?? 'Unknown';

    const renderTransactionList = (list: Transaction[], label: string) => (
        <div className='card bg-base-100 shadow-sm'>
            <div className='p-4 border-b flex justify-between items-center'>
                <h2 className='font-semibold text-base-content'>
                    {label} ({list.length})
                </h2>
                {selectedTransactions.length > 0 && (
                    <button
                        onClick={() => setShowBulkDeleteDialog(true)}
                        className='text-sm text-error hover:text-error/80'
                    >
                        Delete selected ({selectedTransactions.length})
                    </button>
                )}
            </div>

            {viewMode === 'table' ? (
                <div className='overflow-x-auto'>
                    <table className='table table-zebra w-full'>
                        <thead className='sticky top-0 bg-base-100 z-10 shadow-sm'>
                            <tr>
                                <th className='p-3 text-left'>
                                    <input
                                        type='checkbox'
                                        aria-label='Select all transactions'
                                        checked={
                                            list.length > 0 &&
                                            list.every((t) =>
                                                selectedTransactions.includes(
                                                    t.id
                                                )
                                            )
                                        }
                                        onChange={(e) =>
                                            handleSelectAll(e.target.checked)
                                        }
                                    />
                                </th>
                                <th className='p-3 text-left'>Date</th>
                                <th className='p-3 text-left'>Description</th>
                                <th className='p-3 text-left'>Category</th>
                                <th className='p-3 text-right'>Amount</th>
                                <th className='p-3'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((t) => (
                                <tr key={t.id} className='border-t'>
                                    <td className='p-3'>
                                        <input
                                            type='checkbox'
                                            aria-label={`Select transaction: ${t.description}`}
                                            checked={selectedTransactions.includes(
                                                t.id
                                            )}
                                            onChange={(e) =>
                                                handleSelectTransaction(
                                                    t.id,
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    </td>
                                    <td className='p-3 text-base-content/70'>
                                        {formatDateForDisplay(t.date)}
                                    </td>
                                    <td className='p-3 text-base-content'>
                                        {t.description}
                                    </td>
                                    <td className='p-3 text-base-content/70'>
                                        {getCategoryName(t.category)}
                                    </td>
                                    <td
                                        className={`p-3 text-right font-medium tabular-nums ${
                                            t.amount < 0
                                                ? 'text-error'
                                                : 'text-success'
                                        }`}
                                    >
                                        {formatCurrency(t.amount)}
                                    </td>
                                    <td className='p-3'>
                                        <EditDeleteIconButtons
                                            onEdit={() =>
                                                handleEditTransaction(t)
                                            }
                                            onDelete={() =>
                                                handleDeleteRequest(t)
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className='divide-y'>
                    {list.map((t) => (
                        <div key={t.id} className='p-4 flex items-center gap-3'>
                            <input
                                type='checkbox'
                                aria-label={`Select transaction: ${t.description}`}
                                checked={selectedTransactions.includes(t.id)}
                                onChange={(e) =>
                                    handleSelectTransaction(
                                        t.id,
                                        e.target.checked
                                    )
                                }
                            />
                            <div className='flex-1 min-w-0'>
                                <p className='font-medium truncate'>
                                    {t.description}
                                </p>
                                <p className='text-sm text-base-content/60'>
                                    {formatDateForDisplay(t.date)} ·{' '}
                                    {getCategoryName(t.category)}
                                </p>
                            </div>
                            <span
                                className={`font-bold tabular-nums ${
                                    t.amount < 0 ? 'text-error' : 'text-success'
                                }`}
                            >
                                {formatCurrency(t.amount)}
                            </span>
                            <EditDeleteIconButtons
                                onEdit={() => handleEditTransaction(t)}
                                onDelete={() => handleDeleteRequest(t)}
                            />
                        </div>
                    ))}
                    {list.length === 0 && (
                        <p className='p-6 text-center text-base-content/50'>
                            No transactions found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                    <button
                        onClick={() => navigate('/accounts')}
                        className='btn btn-ghost btn-sm'
                        title='Back to Accounts'
                    >
                        ← Back
                    </button>
                    <div>
                        <div className='flex items-center gap-2'>
                            <span className='text-2xl'>
                                {account
                                    ? ACCOUNT_TYPE_ICONS[
                                          account.account_type
                                      ] ?? '🏦'
                                    : '🏦'}
                            </span>
                            <h1 className='text-2xl font-bold text-base-content'>
                                {account?.name ?? 'Account'}
                            </h1>
                        </div>
                        {account?.institution && (
                            <p className='text-sm text-base-content/60 ml-8'>
                                {account.institution}
                            </p>
                        )}
                    </div>
                </div>
                <div className='flex gap-2'>
                    <button
                        onClick={() => {
                            setEditingTransaction(null);
                            setShowTransactionModal(true);
                        }}
                        className='btn btn-primary'
                    >
                        + Add Transaction
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className='grid grid-cols-3 gap-4'>
                <div className='card bg-base-100 shadow-sm p-4 text-center'>
                    <p className='text-sm text-base-content/60'>Expenses</p>
                    <p className='text-xl font-bold text-error tabular-nums'>
                        {formatCurrency(-totalSpends)}
                    </p>
                </div>
                <div className='card bg-base-100 shadow-sm p-4 text-center'>
                    <p className='text-sm text-base-content/60'>Income</p>
                    <p className='text-xl font-bold text-success tabular-nums'>
                        +{formatCurrency(totalIncomes)}
                    </p>
                </div>
                <div className='card bg-base-100 shadow-sm p-4 text-center'>
                    <p className='text-sm text-base-content/60'>Net</p>
                    <p
                        className={`text-xl font-bold tabular-nums ${
                            totalAmount >= 0 ? 'text-success' : 'text-error'
                        }`}
                    >
                        {formatCurrency(totalAmount)}
                    </p>
                </div>
            </div>

            {/* Filter Panel */}
            <div className='card bg-base-100 shadow-sm mb-4'>
                <div className='card-body p-3'>
                    {/* Filter header - always visible */}
                    <div className='flex items-center justify-between'>
                        <button
                            type='button'
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className='flex items-center gap-2 btn btn-ghost btn-sm px-2'
                            aria-expanded={filtersOpen}
                            aria-controls='filter-panel'
                        >
                            <svg
                                className={`w-4 h-4 transition-transform ${
                                    filtersOpen ? 'rotate-180' : ''
                                }`}
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 9l-7 7-7-7'
                                />
                            </svg>
                            <span className='font-medium text-sm'>Filters</span>
                            {activeFilterCount > 0 && (
                                <span className='badge badge-primary badge-sm'>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {activeFilterCount > 0 && (
                            <button
                                type='button'
                                onClick={resetFilters}
                                className='btn btn-ghost btn-xs text-base-content/60'
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    {/* Filter controls - collapsible */}
                    {filtersOpen && (
                        <div
                            id='filter-panel'
                            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-base-200'
                        >
                            <div>
                                <label
                                    htmlFor='filter-search'
                                    className='block text-sm font-medium mb-1'
                                >
                                    Search
                                </label>
                                <input
                                    id='filter-search'
                                    type='text'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder='Search transactions…'
                                    className='input input-bordered w-full'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='filter-category'
                                    className='block text-sm font-medium mb-1'
                                >
                                    Category
                                </label>
                                <CategorySelect
                                    id='filter-category'
                                    categories={categories}
                                    placeholder='All Categories'
                                    value={selectedCategory}
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                    className='input input-bordered w-full'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='filter-year'
                                    className='block text-sm font-medium mb-1'
                                >
                                    Year
                                </label>
                                <select
                                    id='filter-year'
                                    value={selectedYear}
                                    onChange={(e) =>
                                        setSelectedYear(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className='input input-bordered w-full'
                                >
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const y =
                                            new Date().getFullYear() - 2 + i;
                                        return (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor='filter-month'
                                    className='block text-sm font-medium mb-1'
                                >
                                    Month
                                </label>
                                <select
                                    id='filter-month'
                                    value={selectedMonth}
                                    onChange={(e) =>
                                        setSelectedMonth(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    disabled={filterByYear}
                                    className='w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-base-200 disabled:cursor-not-allowed'
                                >
                                    {[
                                        'January',
                                        'February',
                                        'March',
                                        'April',
                                        'May',
                                        'June',
                                        'July',
                                        'August',
                                        'September',
                                        'October',
                                        'November',
                                        'December',
                                    ].map((name, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='col-span-full flex items-end justify-between'>
                                <div>
                                    <label className='block text-sm font-medium mb-1'>
                                        Period
                                    </label>
                                    <div className='join'>
                                        <button
                                            onClick={() =>
                                                setFilterByYear(false)
                                            }
                                            className={`join-item btn btn-sm ${
                                                !filterByYear
                                                    ? 'btn-primary'
                                                    : 'btn-outline'
                                            }`}
                                        >
                                            Month
                                        </button>
                                        <button
                                            onClick={() =>
                                                setFilterByYear(true)
                                            }
                                            className={`join-item btn btn-sm ${
                                                filterByYear
                                                    ? 'btn-primary'
                                                    : 'btn-outline'
                                            }`}
                                        >
                                            Year
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium mb-1'>
                                        View
                                    </label>
                                    <div className='join'>
                                        <button
                                            onClick={() => setViewMode('cards')}
                                            aria-label='Cards view'
                                            aria-pressed={viewMode === 'cards'}
                                            className={`join-item btn btn-sm ${
                                                viewMode === 'cards'
                                                    ? 'btn-primary'
                                                    : 'btn-outline'
                                            }`}
                                        >
                                            <span aria-hidden='true'>📋</span>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            aria-label='Table view'
                                            aria-pressed={viewMode === 'table'}
                                            className={`join-item btn btn-sm ${
                                                viewMode === 'table'
                                                    ? 'btn-primary'
                                                    : 'btn-outline'
                                            }`}
                                        >
                                            <span aria-hidden='true'>📊</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CSV Upload */}
            <BankStatementUpload accountId={accountIdNum ?? undefined} />

            {/* Transaction lists */}
            {transactionsLoading ? (
                <div className='flex justify-center items-center h-32'>
                    <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary'></div>
                </div>
            ) : (
                <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    {renderTransactionList(spendTransactions, '💸 Expenses')}
                    {renderTransactionList(incomeTransactions, '💰 Income')}
                </div>
            )}

            {/* Add / Edit transaction modal */}
            <Modal
                isOpen={showTransactionModal}
                onClose={() => {
                    setShowTransactionModal(false);
                    setEditingTransaction(null);
                }}
            >
                <TransactionForm
                    transaction={editingTransaction ?? undefined}
                    accountId={accountIdNum ?? undefined}
                    onClose={() => {
                        setShowTransactionModal(false);
                        setEditingTransaction(null);
                    }}
                />
            </Modal>

            {/* Delete single transaction */}
            <ConfirmModal
                isOpen={showDeleteTransactionDialog}
                onClose={() => {
                    setShowDeleteTransactionDialog(false);
                    setDeletingTransaction(null);
                }}
                onConfirm={confirmDeleteTransaction}
                title='Delete Transaction'
                message={`Delete "${deletingTransaction?.description ?? ''}"?`}
                isConfirming={deleting}
            />

            {/* Bulk delete */}
            <ConfirmModal
                isOpen={showBulkDeleteDialog}
                onClose={() => setShowBulkDeleteDialog(false)}
                onConfirm={confirmBulkDelete}
                title='Delete Selected Transactions'
                message={`Delete ${selectedTransactions.length} transaction(s)?`}
                isConfirming={isDeleting}
            />
        </div>
    );
}

export default AccountTransactionsPage;
