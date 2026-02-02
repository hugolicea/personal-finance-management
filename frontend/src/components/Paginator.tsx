import type { Table } from '@tanstack/react-table';

type PaginatorProps<T> = {
    table: Table<T>;
    className?: string;
};

export default function Paginator<T>({ table, className }: PaginatorProps<T>) {
    const pageIndex = table.getState().pagination.pageIndex ?? 0;
    const pageSize = table.getState().pagination.pageSize ?? 0;
    const filteredCount = table.getFilteredRowModel
        ? table.getFilteredRowModel().rows.length
        : table.getRowModel().rows.length;

    return (
        <div
            className={
                className ||
                'px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between'
            }
        >
            <div className='flex-1 flex justify-between sm:hidden'>
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className='relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
                >
                    Previous
                </button>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className='relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
                >
                    Next
                </button>
            </div>

            <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                <div>
                    <p className='text-sm text-gray-700'>
                        Showing{' '}
                        <span className='font-medium'>
                            {pageIndex * pageSize + 1}
                        </span>{' '}
                        to{' '}
                        <span className='font-medium'>
                            {Math.min(
                                (pageIndex + 1) * pageSize,
                                filteredCount
                            )}
                        </span>{' '}
                        of <span className='font-medium'>{filteredCount}</span>{' '}
                        results
                    </p>
                </div>

                <div>
                    <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                        >
                            <span className='sr-only'>Previous</span>‹
                        </button>
                        {Array.from({
                            length: Math.max(1, table.getPageCount()),
                        }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => table.setPageIndex(i)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    table.getState().pagination.pageIndex === i
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                        >
                            <span className='sr-only'>Next</span>›
                        </button>
                    </nav>
                </div>

                <div>
                    <select
                        value={pageSize}
                        onChange={(e) =>
                            table.setPageSize(Number(e.target.value))
                        }
                        className='border rounded px-2 py-1'
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
