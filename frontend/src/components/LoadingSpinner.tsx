import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    fullScreen = false,
    message,
}) => {
    const sizeClass = {
        small: 'loading-sm',
        medium: 'loading-md',
        large: 'loading-lg',
    }[size];

    const spinner = (
        <div className='flex flex-col items-center justify-center gap-3'>
            <span
                className={`loading loading-spinner text-primary ${sizeClass}`}
            />
            {message && (
                <p className='text-sm opacity-60 animate-pulse'>{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className='fixed inset-0 bg-base-100 bg-opacity-90 flex items-center justify-center z-50'>
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
