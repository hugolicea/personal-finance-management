import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import ConfirmModal from '../components/ConfirmModal';
import EditDeleteButtons from '../components/EditDeleteButtons';
import HeritageForm from '../components/HeritageForm';
import Modal from '../components/Modal';
import Paginator from '../components/Paginator';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { deleteHeritage, fetchHeritages } from '../store/slices/heritagesSlice';
import type { Heritage } from '../types/heritage';
import { formatCurrency } from '../utils/formatters';

function Heritage() {
    const dispatch = useAppDispatch();
    const { heritages, loading, deleting } = useAppSelector(
        (state) => state.heritages
    );

    const [showHeritageModal, setShowHeritageModal] = useState(false);
    const [editingHeritage, setEditingHeritage] = useState<Heritage | null>(
        null
    );
    const [showDeleteHeritageDialog, setShowDeleteHeritageDialog] =
        useState(false);
    const [deletingHeritage, setDeletingHeritage] = useState<Heritage | null>(
        null
    );
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'gain_loss_percentage', desc: true },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    useEffect(() => {
        dispatch(fetchHeritages());
    }, [dispatch]);

    const handleEditHeritage = useCallback((heritage: Heritage) => {
        setEditingHeritage(heritage);
        setShowHeritageModal(true);
    }, []);

    const handleDeleteHeritage = useCallback((heritage: Heritage) => {
        setDeletingHeritage(heritage);
        setShowDeleteHeritageDialog(true);
    }, []);

    const confirmDeleteHeritage = useCallback(async () => {
        if (deletingHeritage) {
            await dispatch(deleteHeritage(deletingHeritage.id));
            setShowDeleteHeritageDialog(false);
            setDeletingHeritage(null);
        }
    }, [deletingHeritage, dispatch]);

    const handleOpenModal = useCallback(() => setShowHeritageModal(true), []);

    const handleCloseModal = useCallback(() => {
        setShowHeritageModal(false);
        setEditingHeritage(null);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        if (!deleting) setShowDeleteHeritageDialog(false);
    }, [deleting]);

    const columns = useMemo<ColumnDef<Heritage>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Property Name',
                cell: ({ row }) => (
                    <div className='font-semibold text-primary'>
                        {row.original.name}
                    </div>
                ),
            },
            {
                accessorKey: 'heritage_type',
                header: 'Type',
                cell: ({ row }) => (
                    <span className='badge badge-success badge-sm'>
                        {row.original.heritage_type
                            .replace(/_/g, ' ')
                            .toUpperCase()}
                    </span>
                ),
            },
            {
                accessorKey: 'address',
                header: 'Address',
                cell: ({ row }) => (
                    <div
                        className='text-sm max-w-xs truncate'
                        title={row.original.address}
                    >
                        {row.original.address}
                    </div>
                ),
            },
            {
                id: 'area_display',
                header: 'Area',
                cell: ({ row }) => (
                    <div className='text-sm'>
                        {row.original.area ? (
                            `${row.original.area} ${row.original.area_unit}`
                        ) : (
                            <span className='text-gray-400'>-</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'purchase_price',
                header: 'Purchase Price',
                cell: ({ row }) => (
                    <div className='text-sm'>
                        {formatCurrency(row.original.purchase_price)}
                    </div>
                ),
            },
            {
                accessorKey: 'current_value',
                header: 'Current Value',
                cell: ({ row }) => (
                    <div className='text-sm font-semibold text-success'>
                        {row.original.current_value ? (
                            formatCurrency(row.original.current_value)
                        ) : (
                            <span className='text-gray-400'>Not set</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'monthly_rental_income',
                header: 'Monthly Rent',
                cell: ({ row }) => (
                    <div className='text-sm'>
                        {formatCurrency(row.original.monthly_rental_income)}
                    </div>
                ),
            },
            {
                id: 'gain_loss',
                header: 'Gain/Loss',
                cell: ({ row }) => {
                    const gainLoss = row.original.gain_loss;
                    const isPositive = gainLoss >= 0;
                    return (
                        <div
                            className={`text-sm font-semibold ${
                                isPositive ? 'text-success' : 'text-error'
                            }`}
                        >
                            {isPositive ? '+' : ''}
                            {formatCurrency(gainLoss)}
                        </div>
                    );
                },
                sortingFn: (rowA, rowB) =>
                    rowA.original.gain_loss - rowB.original.gain_loss,
            },
            {
                id: 'gain_loss_percentage',
                header: 'Gain/Loss %',
                cell: ({ row }) => {
                    const percentage = row.original.gain_loss_percentage;
                    const isPositive = percentage >= 0;
                    return (
                        <div
                            className={`text-sm font-semibold ${
                                isPositive ? 'text-success' : 'text-error'
                            }`}
                        >
                            {isPositive ? '+' : ''}
                            {percentage.toFixed(2)}%
                        </div>
                    );
                },
                sortingFn: (rowA, rowB) =>
                    rowA.original.gain_loss_percentage -
                    rowB.original.gain_loss_percentage,
            },
            {
                id: 'rental_yield_percentage',
                header: 'Rental Yield %',
                cell: ({ row }) => (
                    <div className='text-sm font-semibold text-primary'>
                        {row.original.rental_yield_percentage.toFixed(2)}%
                    </div>
                ),
                sortingFn: (rowA, rowB) =>
                    rowA.original.rental_yield_percentage -
                    rowB.original.rental_yield_percentage,
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <EditDeleteButtons
                        onEdit={() => handleEditHeritage(row.original)}
                        onDelete={() => handleDeleteHeritage(row.original)}
                    />
                ),
            },
        ],
        [handleEditHeritage, handleDeleteHeritage]
    );

    const table = useReactTable({
        data: heritages,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const {
        totalPortfolioValue,
        totalGainLoss,
        totalAnnualRentalIncome,
        averageRentalYield,
    } = useMemo(() => {
        let totalPortfolioValue = 0;
        let totalGainLoss = 0;
        let totalAnnualRentalIncome = 0;
        for (const h of heritages) {
            totalPortfolioValue += h.current_value ?? h.purchase_price;
            totalGainLoss += h.gain_loss;
            totalAnnualRentalIncome += h.annual_rental_income;
        }
        const averageRentalYield =
            totalPortfolioValue > 0
                ? (totalAnnualRentalIncome / totalPortfolioValue) * 100
                : 0;
        return {
            totalPortfolioValue,
            totalGainLoss,
            totalAnnualRentalIncome,
            averageRentalYield,
        };
    }, [heritages]);

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='loading loading-spinner loading-lg text-primary'></div>
            </div>
        );
    }

    return (
        <div className='px-4 sm:px-6 lg:px-8'>
            <div className='sm:flex sm:items-center'>
                <div className='sm:flex-auto'>
                    <h1 className='text-2xl font-semibold'>Heritage</h1>
                    <p className='mt-2 text-sm opacity-70'>
                        Track your real estate properties and monitor their
                        performance.
                    </p>
                </div>
            </div>

            {/* Add Property Button - Positioned below the header */}
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
                    Add Property
                </button>
            </div>

            {/* Portfolio Summary */}
            <div className='mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='card bg-base-100 shadow-sm'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='flex-shrink-0'>
                                <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
                                    <span
                                        className='text-white text-sm font-bold'
                                        aria-hidden='true'
                                    >
                                        🏠
                                    </span>
                                </div>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Total Property Value
                                    </dt>
                                    <dd className='text-lg font-medium'>
                                        {formatCurrency(totalPortfolioValue)}
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
                                <div
                                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                        totalGainLoss >= 0
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                    }`}
                                >
                                    <span
                                        className='text-white text-sm font-bold'
                                        aria-hidden='true'
                                    >
                                        {totalGainLoss >= 0 ? '+' : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Total Gain/Loss
                                    </dt>
                                    <dd
                                        className={`text-lg font-medium ${
                                            totalGainLoss >= 0
                                                ? 'text-success'
                                                : 'text-error'
                                        }`}
                                    >
                                        {totalGainLoss >= 0 ? '+' : ''}
                                        {formatCurrency(totalGainLoss)}
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
                                <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
                                    <span
                                        className='text-white text-sm font-bold'
                                        aria-hidden='true'
                                    >
                                        💰
                                    </span>
                                </div>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Annual Rental Income
                                    </dt>
                                    <dd className='text-lg font-medium'>
                                        {formatCurrency(
                                            totalAnnualRentalIncome
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
                                <div className='w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center'>
                                    <span
                                        className='text-white text-sm font-bold'
                                        aria-hidden='true'
                                    >
                                        📈
                                    </span>
                                </div>
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='text-sm font-medium opacity-60 truncate'>
                                        Avg Rental Yield
                                    </dt>
                                    <dd className='text-lg font-medium'>
                                        {averageRentalYield.toFixed(2)}%
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties Table */}
            <div className='mt-8'>
                <div className='mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
                    <div className='mb-4 sm:mb-0'>
                        <input
                            type='text'
                            placeholder='Search properties...'
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className='block w-full max-w-md px-3 py-2 border border-base-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm'
                        />
                    </div>
                    <div className='text-sm text-gray-500 lg:hidden'>
                        <span className='inline-flex items-center'>
                            <svg
                                className='w-4 h-4 mr-1'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                            >
                                <path
                                    fillRule='evenodd'
                                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                    clipRule='evenodd'
                                />
                            </svg>
                            More columns available on larger screens
                        </span>
                    </div>
                </div>

                {/* Mobile/Tablet Card Layout */}
                <div className='block lg:hidden'>
                    <div className='space-y-4'>
                        {table.getRowModel().rows.map((row) => {
                            const heritage = row.original;
                            return (
                                <div
                                    key={row.id}
                                    className='card bg-base-100 shadow-sm p-4 border border-base-300'
                                >
                                    <div className='flex items-start justify-between'>
                                        <div className='flex-1'>
                                            <h3 className='text-lg font-semibold text-primary mb-2'>
                                                {heritage.name}
                                            </h3>
                                            <div className='grid grid-cols-2 gap-4 text-sm'>
                                                <div>
                                                    <span className='font-medium'>
                                                        Type:
                                                    </span>
                                                    <span className='ml-2 badge badge-success badge-sm'>
                                                        {heritage.heritage_type
                                                            .replace(/_/g, ' ')
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Address:
                                                    </span>
                                                    <span
                                                        className='ml-2 text-gray-900 truncate block max-w-32'
                                                        title={heritage.address}
                                                    >
                                                        {heritage.address}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Purchase Price:
                                                    </span>
                                                    <span className='ml-2 text-gray-900'>
                                                        {formatCurrency(
                                                            heritage.purchase_price
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Current Value:
                                                    </span>
                                                    <span className='ml-2 text-gray-900 font-semibold text-success'>
                                                        {heritage.current_value
                                                            ? formatCurrency(
                                                                  heritage.current_value
                                                              )
                                                            : 'Not set'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Monthly Rent:
                                                    </span>
                                                    <span className='ml-2 text-gray-900'>
                                                        {formatCurrency(
                                                            heritage.monthly_rental_income
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Gain/Loss:
                                                    </span>
                                                    <span
                                                        className={`ml-2 font-semibold ${
                                                            heritage.gain_loss >=
                                                            0
                                                                ? 'text-success'
                                                                : 'text-error'
                                                        }`}
                                                    >
                                                        {heritage.gain_loss >= 0
                                                            ? '+'
                                                            : ''}
                                                        {formatCurrency(
                                                            heritage.gain_loss
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex space-x-2 ml-4'>
                                            <button
                                                onClick={() =>
                                                    handleEditHeritage(heritage)
                                                }
                                                className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                                            >
                                                <svg
                                                    className='w-4 h-4 mr-1.5'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                    />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteHeritage(
                                                        heritage
                                                    )
                                                }
                                                className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200'
                                            >
                                                <svg
                                                    className='w-4 h-4 mr-1.5'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                    />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Desktop Table Layout */}
                <div className='hidden lg:block card bg-base-100 shadow-sm overflow-hidden'>
                    <div className='overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
                        <div className='inline-block w-full align-middle'>
                            <table className='table table-zebra w-full'>
                                <thead>
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(
                                                    (header) => (
                                                        <th
                                                            key={header.id}
                                                            scope='col'
                                                            className='px-4 py-2 text-left text-xs font-medium opacity-60 uppercase cursor-pointer hover:bg-gray-100'
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            aria-sort={
                                                                header.column.getIsSorted() ===
                                                                'asc'
                                                                    ? 'ascending'
                                                                    : header.column.getIsSorted() ===
                                                                        'desc'
                                                                      ? 'descending'
                                                                      : 'none'
                                                            }
                                                        >
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                      header
                                                                          .column
                                                                          .columnDef
                                                                          .header,
                                                                      header.getContext()
                                                                  )}
                                                            {header.column.getIsSorted() ? (
                                                                <span aria-hidden='true'>
                                                                    {header.column.getIsSorted() ===
                                                                    'asc'
                                                                        ? ' \ud83d\udd3c'
                                                                        : ' \ud83d\udd3d'}
                                                                </span>
                                                            ) : null}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row) => (
                                        <tr key={row.id} className=''>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className='px-4 py-2 whitespace-nowrap'
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Paginator table={table} />
                </div>
            </div>

            {/* Property Form Modal */}
            <Modal
                isOpen={showHeritageModal}
                onClose={handleCloseModal}
                title={editingHeritage ? 'Edit Property' : 'Add Property'}
            >
                <HeritageForm
                    heritage={editingHeritage ?? undefined}
                    onClose={handleCloseModal}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteHeritageDialog}
                onClose={handleCloseDeleteModal}
                onConfirm={confirmDeleteHeritage}
                title='Delete Property'
                message={
                    <>
                        <div className='flex items-start'>
                            <div className='flex-shrink-0'>
                                <svg
                                    className='h-6 w-6 text-red-400'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    strokeWidth='1.5'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                                    />
                                </svg>
                            </div>
                            <div className='ml-3 w-full'>
                                <h3 className='text-sm font-medium text-gray-800'>
                                    Delete Property
                                </h3>
                                <div className='mt-2'>
                                    <p className='text-sm text-gray-500'>
                                        You are about to permanently delete the
                                        property{' '}
                                        <span className='font-semibold text-gray-700'>
                                            "{deletingHeritage?.name}"
                                        </span>
                                        . This action cannot be undone.
                                    </p>
                                </div>
                                {deletingHeritage && (
                                    <div className='mt-3 p-3 bg-base-200 rounded-md'>
                                        <div className='text-sm'>
                                            <div className='grid grid-cols-2 gap-4'>
                                                <div>
                                                    <span className='font-medium'>
                                                        Type:
                                                    </span>{' '}
                                                    <span className='text-gray-900 capitalize'>
                                                        {deletingHeritage.heritage_type.replace(
                                                            /_/g,
                                                            ' '
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Address:
                                                    </span>{' '}
                                                    <span className='text-gray-900'>
                                                        {
                                                            deletingHeritage.address
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Current Value:
                                                    </span>{' '}
                                                    <span className='text-gray-900 font-semibold'>
                                                        {formatCurrency(
                                                            deletingHeritage.current_value ||
                                                                deletingHeritage.purchase_price
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Monthly Rental Income:
                                                    </span>{' '}
                                                    <span className='text-gray-900'>
                                                        {formatCurrency(
                                                            deletingHeritage.monthly_rental_income
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Gain/Loss:
                                                    </span>{' '}
                                                    <span
                                                        className={`font-semibold ${
                                                            deletingHeritage.gain_loss >=
                                                            0
                                                                ? 'text-success'
                                                                : 'text-error'
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            deletingHeritage.gain_loss
                                                        )}{' '}
                                                        (
                                                        {deletingHeritage.gain_loss_percentage.toFixed(
                                                            2
                                                        )}
                                                        %)
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className='font-medium'>
                                                        Rental Yield:
                                                    </span>{' '}
                                                    <span className='text-gray-900 font-semibold text-primary'>
                                                        {deletingHeritage.rental_yield_percentage.toFixed(
                                                            2
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className='mt-3'>
                                    <p className='text-sm text-error font-medium'>
                                        <span aria-hidden='true'>⚠️</span> This
                                        will permanently remove all data
                                        associated with this property.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                }
                confirmLabel='Delete Property'
                cancelLabel='Cancel'
                isDanger
                isConfirming={deleting}
            />
        </div>
    );
}

export default Heritage;
