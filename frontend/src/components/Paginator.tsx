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
                'px-4 py-3 bg-base-200 border-t border-base-300 flex flex-wrap items-center justify-between gap-2'
            }
        >
            {/* Mobile prev/next */}
            <div className='flex sm:hidden gap-2'>
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className='btn btn-sm btn-outline'
                >
                    Previous
                </button>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className='btn btn-sm btn-outline'
                >
                    Next
                </button>
            </div>

            {/* Desktop */}
            <div className='hidden sm:flex flex-1 items-center justify-between gap-4'>
                <p className='text-sm opacity-70'>
                    Showing{' '}
                    <span className='font-medium'>
                        {pageIndex * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium'>
                        {Math.min((pageIndex + 1) * pageSize, filteredCount)}
                    </span>{' '}
                    of <span className='font-medium'>{filteredCount}</span>{' '}
                    results
                </p>

                <div className='join'>
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className='join-item btn btn-sm'
                    >
                        ‹
                    </button>
                    {Array.from({
                        length: Math.max(1, table.getPageCount()),
                    }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => table.setPageIndex(i)}
                            className={`join-item btn btn-sm ${
                                table.getState().pagination.pageIndex === i
                                    ? 'btn-active btn-primary'
                                    : ''
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className='join-item btn btn-sm'
                    >
                        ›
                    </button>
                </div>

                <select
                    value={pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className='select select-bordered select-sm'
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                </select>
            </div>
        </div>
    );
}
