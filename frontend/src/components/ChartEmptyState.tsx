import type { ReactNode } from 'react';

interface ChartEmptyStateProps {
    icon?: ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

function ChartEmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: ChartEmptyStateProps) {
    return (
        <div className='flex min-h-[140px] flex-col items-center justify-center p-4 text-center'>
            {icon ? <div className='mb-2 text-4xl'>{icon}</div> : null}
            <h3 className='mb-1 text-base font-semibold text-base-content'>
                {title}
            </h3>
            <p className='mb-2 max-w-md text-sm text-base-content/60'>
                {description}
            </p>
            {actionLabel && onAction ? (
                <button
                    onClick={onAction}
                    className='btn-secondary-action'
                    type='button'
                >
                    {actionLabel}
                </button>
            ) : null}
        </div>
    );
}

export default ChartEmptyState;
