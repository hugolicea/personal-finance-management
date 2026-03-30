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
        <div className='flex min-h-[300px] flex-col items-center justify-center p-8 text-center'>
            {icon ? <div className='mb-group text-6xl'>{icon}</div> : null}
            <h3 className='mb-2 text-xl font-semibold text-base-content'>
                {title}
            </h3>
            <p className='mb-group max-w-md text-base-content/60'>
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
