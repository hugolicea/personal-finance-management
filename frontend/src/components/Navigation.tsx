interface NavigationProps {
    onMenuClick?: () => void;
}

function Navigation({ onMenuClick }: NavigationProps) {
    return (
        <nav className='bg-white shadow-sm border-b border-gray-200 lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-10'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between h-16'>
                    <div className='flex items-center'>
                        {/* Mobile menu button */}
                        <button
                            onClick={onMenuClick}
                            className='lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500'
                        >
                            <span className='sr-only'>Open sidebar</span>
                            <svg
                                className='h-6 w-6'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth='1.5'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                                />
                            </svg>
                        </button>

                        <div className='flex-shrink-0 flex items-center ml-4 lg:ml-0'>
                            <h1 className='text-xl font-bold text-gray-900'>
                                💰 Personal Finance Managment
                            </h1>
                        </div>
                    </div>

                    {/* Desktop header content can go here if needed */}
                    <div className='hidden lg:flex lg:items-center lg:justify-end'>
                        <div className='text-sm text-gray-500'>
                            Professional Budget Management
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
