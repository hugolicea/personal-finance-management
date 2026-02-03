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
    const sizeClasses = {
        small: 'w-6 h-6',
        medium: 'w-12 h-12',
        large: 'w-16 h-16',
    };

    const spinner = (
        <div className='flex flex-col items-center justify-center gap-3'>
            <div className={`${sizeClasses[size]} relative`}>
                <div className='absolute inset-0 border-4 border-gray-200 rounded-full'></div>
                <div className='absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin'></div>
            </div>
            {message && (
                <p className='text-sm text-gray-600 animate-pulse'>{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className='fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'>
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
