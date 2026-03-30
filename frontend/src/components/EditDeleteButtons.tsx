import type { ReactElement } from 'react';

type Props = {
    onEdit: () => void;
    onDelete: () => void;
    className?: string;
};

export default function EditDeleteButtons({
    onEdit,
    onDelete,
    className = '',
}: Props): ReactElement {
    return (
        <div className={className + ' flex items-center gap-2'}>
            <button
                onClick={onEdit}
                className='btn btn-outline btn-info btn-sm'
                aria-label='Edit'
            >
                <svg
                    className='w-4 h-4'
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
                onClick={onDelete}
                className='btn btn-outline btn-error btn-sm'
                aria-label='Delete'
            >
                <svg
                    className='w-4 h-4'
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
    );
}
