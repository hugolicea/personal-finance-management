import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // You can log to an error reporting service here
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className='min-h-screen flex items-center justify-center bg-base-200'>
                    <div className='max-w-md w-full bg-base-100 shadow-lg rounded-lg p-6'>
                        <div className='flex items-center justify-center w-12 h-12 mx-auto bg-error/20 rounded-full'>
                            <svg
                                className='w-6 h-6 text-error'
                                fill='none'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path d='M6 18L18 6M6 6l12 12'></path>
                            </svg>
                        </div>
                        <h3 className='mt-4 text-lg font-medium text-base-content text-center'>
                            Something went wrong
                        </h3>
                        <p className='mt-2 text-sm text-base-content/70 text-center'>
                            {this.state.error?.message ||
                                'An unexpected error occurred'}
                        </p>
                        <div className='mt-6'>
                            <button
                                onClick={() => window.location.reload()}
                                className='btn btn-primary w-full px-4 py-2'
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
