import { useEffect, useState } from 'react';

import BankStatementUpload from '../components/BankStatementUpload';
import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    deleteCategory,
    fetchCategories,
} from '../store/slices/categoriesSlice';
import {
    deleteTransaction,
    fetchTransactions,
} from '../store/slices/transactionsSlice';

function Transactions() {
    const dispatch = useAppDispatch();
    const { categories, loading: categoriesLoading } = useAppSelector(
        (state) => state.categories
    );
    const { transactions, loading: transactionsLoading } = useAppSelector(
        (state) => state.transactions
    );

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
        useState(false);
    const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
        useState(false);
    const [deletingCategory, setDeletingCategory] = useState<any>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<any>(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    ); // JS months are 0-based
    const [filterByYear, setFilterByYear] = useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchTransactions());
    }, [dispatch]);

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category: any) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setShowTransactionModal(true);
    };

    const handleEditTransaction = (transaction: any) => {
        setEditingTransaction(transaction);
        setShowTransactionModal(true);
    };

    const handleDeleteCategory = (category: any) => {
        setDeletingCategory(category);
        setShowDeleteCategoryDialog(true);
    };

    const handleDeleteTransaction = (transaction: any) => {
        setDeletingTransaction(transaction);
        setShowDeleteTransactionDialog(true);
    };

    const confirmDeleteCategory = async () => {
        if (deletingCategory) {
            try {
                await dispatch(deleteCategory(deletingCategory.id)).unwrap();
                dispatch(fetchCategories());
                setShowDeleteCategoryDialog(false);
                setDeletingCategory(null);
            } catch (error) {
                console.error('Failed to delete category:', error);
                alert('Failed to delete category. Please try again.');
            }
        }
    };

    const confirmDeleteTransaction = async () => {
        if (deletingTransaction) {
            try {
                await dispatch(
                    deleteTransaction(deletingTransaction.id)
                ).unwrap();
                dispatch(fetchTransactions());
                setShowDeleteTransactionDialog(false);
                setDeletingTransaction(null);
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                alert('Failed to delete transaction. Please try again.');
            }
        }
    };

    const closeModals = () => {
        setShowCategoryModal(false);
        setShowTransactionModal(false);
        setShowDeleteCategoryDialog(false);
        setShowDeleteTransactionDialog(false);
        setEditingCategory(null);
        setEditingTransaction(null);
        setDeletingCategory(null);
        setDeletingTransaction(null);
    };

    // Filter transactions based on search and filters
    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch = transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesCategory =
            !selectedCategory ||
            transaction.category.toString() === selectedCategory;
        const transactionDate = new Date(transaction.date);
        const transactionYear = transactionDate.getFullYear();
        const transactionMonth = transactionDate.getMonth() + 1; // JS months are 0-based
        const matchesPeriod = filterByYear
            ? transactionYear === selectedYear
            : transactionYear === selectedYear &&
              transactionMonth === selectedMonth;

        return matchesSearch && matchesCategory && matchesPeriod;
    });

    // Separate transactions into spends and incomes
    const spendTransactions = filteredTransactions.filter(
        (transaction) => parseFloat(transaction.amount) < 0
    );
    const incomeTransactions = filteredTransactions.filter(
        (transaction) => parseFloat(transaction.amount) >= 0
    );

    // Calculate totals
    const totalSpends = spendTransactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.amount),
        0
    );
    const totalIncomes = incomeTransactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.amount),
        0
    );
    const totalAmount = totalIncomes + totalSpends;

    const getCategoryName = (categoryId: number) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name || 'Unknown';
    };

    return (
        <div className='pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-gray-900 mb-8'>
                        Transactions
                    </h1>

                    {/* Filters */}
                    <div className='bg-white p-4 rounded-lg shadow mb-6'>
                        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Search
                                </label>
                                <input
                                    type='text'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder='Search transactions...'
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                >
                                    <option value=''>All Categories</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Year
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) =>
                                        setSelectedYear(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                                >
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year =
                                            new Date().getFullYear() - 2 + i;
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Month
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) =>
                                        setSelectedMonth(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    disabled={filterByYear}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                                >
                                    <option value={1}>January</option>
                                    <option value={2}>February</option>
                                    <option value={3}>March</option>
                                    <option value={4}>April</option>
                                    <option value={5}>May</option>
                                    <option value={6}>June</option>
                                    <option value={7}>July</option>
                                    <option value={8}>August</option>
                                    <option value={9}>September</option>
                                    <option value={10}>October</option>
                                    <option value={11}>November</option>
                                    <option value={12}>December</option>
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Filter
                                </label>
                                <div className='flex items-center space-x-2'>
                                    <button
                                        onClick={() => setFilterByYear(false)}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            !filterByYear
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setFilterByYear(true)}
                                        className={`px-3 py-2 text-sm rounded-md border ${
                                            filterByYear
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Year
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Transaction Button */}
                    <div className='flex justify-between items-center mb-4'>
                        <div className='flex items-center space-x-6'>
                            <span className='text-sm text-gray-500'>
                                {filteredTransactions.length} transaction
                                {filteredTransactions.length !== 1
                                    ? 's'
                                    : ''}{' '}
                                for{' '}
                                {filterByYear
                                    ? selectedYear
                                    : `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
                            </span>
                            <div className='flex space-x-4 text-sm'>
                                <div>
                                    <span className='text-gray-500'>
                                        Spends:{' '}
                                    </span>
                                    <span className='font-semibold text-red-600'>
                                        ${Math.abs(totalSpends).toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-500'>
                                        Incomes:{' '}
                                    </span>
                                    <span className='font-semibold text-green-600'>
                                        ${totalIncomes.toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className='text-gray-500'>Net: </span>
                                    <span
                                        className={`font-semibold ${
                                            totalAmount >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        ${Math.abs(totalAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleAddTransaction}
                            className='bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 border-2 border-green-800'
                        >
                            ➕ Add Transaction
                        </button>
                    </div>

                    {/* Transactions Panels */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Spends Panel */}
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
                                <div className='flex items-center justify-between'>
                                    <h3 className='text-lg font-medium text-red-900'>
                                        💸 Spends
                                    </h3>
                                    <span className='text-sm font-semibold text-red-600'>
                                        ${Math.abs(totalSpends).toFixed(2)}
                                    </span>
                                </div>
                                <p className='text-sm text-red-700 mt-1'>
                                    {spendTransactions.length} transaction
                                    {spendTransactions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {transactionsLoading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading...
                                </div>
                            ) : spendTransactions.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No spending transactions found
                                </div>
                            ) : (
                                <ul className='divide-y divide-gray-200'>
                                    {spendTransactions.map((transaction) => (
                                        <li
                                            key={transaction.id}
                                            className='px-6 py-4'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1'>
                                                    <div className='flex items-center justify-between'>
                                                        <div>
                                                            <h3 className='text-sm font-medium text-gray-900'>
                                                                {
                                                                    transaction.description
                                                                }
                                                            </h3>
                                                            <p className='text-sm text-gray-500'>
                                                                {getCategoryName(
                                                                    transaction.category
                                                                )}{' '}
                                                                •{' '}
                                                                {new Date(
                                                                    transaction.date
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className='text-right'>
                                                            <span className='text-lg font-semibold text-red-600'>
                                                                $
                                                                {Math.abs(
                                                                    parseFloat(
                                                                        transaction.amount
                                                                    )
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='ml-4 flex space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            handleEditTransaction(
                                                                transaction
                                                            )
                                                        }
                                                        className='text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors'
                                                        title='Edit transaction'
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteTransaction(
                                                                transaction
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors'
                                                        title='Delete transaction'
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Incomes Panel */}
                        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                            <div className='px-6 py-4 bg-green-50 border-b border-green-200'>
                                <div className='flex items-center justify-between'>
                                    <h3 className='text-lg font-medium text-green-900'>
                                        💰 Incomes
                                    </h3>
                                    <span className='text-sm font-semibold text-green-600'>
                                        ${totalIncomes.toFixed(2)}
                                    </span>
                                </div>
                                <p className='text-sm text-green-700 mt-1'>
                                    {incomeTransactions.length} transaction
                                    {incomeTransactions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {transactionsLoading ? (
                                <div className='p-6 text-center text-gray-500'>
                                    Loading...
                                </div>
                            ) : incomeTransactions.length === 0 ? (
                                <div className='p-6 text-center text-gray-500'>
                                    No income transactions found
                                </div>
                            ) : (
                                <ul className='divide-y divide-gray-200'>
                                    {incomeTransactions.map((transaction) => (
                                        <li
                                            key={transaction.id}
                                            className='px-6 py-4'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1'>
                                                    <div className='flex items-center justify-between'>
                                                        <div>
                                                            <h3 className='text-sm font-medium text-gray-900'>
                                                                {
                                                                    transaction.description
                                                                }
                                                            </h3>
                                                            <p className='text-sm text-gray-500'>
                                                                {getCategoryName(
                                                                    transaction.category
                                                                )}{' '}
                                                                •{' '}
                                                                {new Date(
                                                                    transaction.date
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className='text-right'>
                                                            <span className='text-lg font-semibold text-green-600'>
                                                                $
                                                                {Math.abs(
                                                                    parseFloat(
                                                                        transaction.amount
                                                                    )
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='ml-4 flex space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            handleEditTransaction(
                                                                transaction
                                                            )
                                                        }
                                                        className='text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors'
                                                        title='Edit transaction'
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteTransaction(
                                                                transaction
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors'
                                                        title='Delete transaction'
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bank Statement Upload */}
                <div className='mt-8'>
                    <BankStatementUpload />
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showCategoryModal} onClose={closeModals}>
                <CategoryForm
                    category={editingCategory}
                    onClose={closeModals}
                />
            </Modal>

            <Modal isOpen={showTransactionModal} onClose={closeModals}>
                <TransactionForm
                    transaction={editingTransaction}
                    onClose={closeModals}
                />
            </Modal>

            {/* Delete Confirmation Modals */}
            <Modal
                isOpen={showDeleteCategoryDialog}
                onClose={() => setShowDeleteCategoryDialog(false)}
            >
                <div className='p-6'>
                    <h3 className='text-lg font-medium text-gray-900 mb-4'>
                        Delete Category
                    </h3>
                    <p className='text-sm text-gray-500 mb-4'>
                        Are you sure you want to delete the category "
                        {deletingCategory?.name}"? This action cannot be undone.
                    </p>
                    <div className='flex justify-end space-x-3'>
                        <button
                            onClick={() => setShowDeleteCategoryDialog(false)}
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteCategory}
                            className='px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700'
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showDeleteTransactionDialog}
                onClose={() => setShowDeleteTransactionDialog(false)}
            >
                <div className='p-6'>
                    <h3 className='text-lg font-medium text-gray-900 mb-4'>
                        Delete Transaction
                    </h3>
                    <p className='text-sm text-gray-500 mb-4'>
                        Are you sure you want to delete the transaction "
                        {deletingTransaction?.description}"? This action cannot
                        be undone.
                    </p>
                    <div className='flex justify-end space-x-3'>
                        <button
                            onClick={() =>
                                setShowDeleteTransactionDialog(false)
                            }
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteTransaction}
                            className='px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700'
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Transactions;
