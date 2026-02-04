import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Navigation from '../components/Navigation';
import AppRoutes from '../routes/AppRoutes';

function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleViewChange = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div className='min-h-screen bg-gray-100'>
            <Navigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className='fixed inset-0 z-40 xl:hidden'>
                    <div
                        className='fixed inset-0 bg-gray-600 bg-opacity-75'
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className='relative flex w-full max-w-xs flex-col bg-white'>
                        <SidebarContent
                            currentPath={location.pathname}
                            onViewChange={handleViewChange}
                        />
                    </div>
                </div>
            )}

            <div className='flex'>
                {/* Desktop sidebar */}
                <div className='hidden xl:fixed xl:inset-y-0 xl:flex xl:w-64 xl:flex-col'>
                    <div className='flex flex-grow flex-col overflow-y-auto bg-white pt-16 shadow'>
                        <SidebarContent
                            currentPath={location.pathname}
                            onViewChange={handleViewChange}
                        />
                    </div>
                </div>

                {/* Main content */}
                <div className='flex flex-1 flex-col xl:pl-64'>
                    <main className='flex-1'>
                        <div className='py-6'>
                            <div className='mx-auto max-w-screen-2xl px-4 sm:px-6 xl:px-8'>
                                <AppRoutes />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

interface SidebarContentProps {
    currentPath: string;
    onViewChange: (path: string) => void;
}

function SidebarContent({ currentPath, onViewChange }: SidebarContentProps) {
    const [transactionsOpen, setTransactionsOpen] = useState(
        currentPath === '/credit-card-transactions' ||
            currentPath === '/account-transactions'
    );

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/categories', label: 'Categories', icon: '🏷️' },
        { path: '/investments', label: 'Investments', icon: '📈' },
        { path: '/heritage', label: 'Heritage', icon: '🏠' },
        { path: '/retirement', label: 'Retirement', icon: '🏖️' },
        { path: '/reports', label: 'Reports', icon: '📊' },
        {
            path: '/clean-and-reclassify',
            label: 'Clean & Reclassify',
            icon: '🧹',
        },
    ];

    return (
        <nav className='mt-5 flex-1 px-2'>
            <div className='space-y-1'>
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => onViewChange(item.path)}
                        className={`${
                            currentPath === item.path
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium border-l-4`}
                    >
                        <span className='mr-3 text-lg'>{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                {/* Transactions menu group */}
                <div className='space-y-1'>
                    <button
                        type='button'
                        onClick={() => setTransactionsOpen((open) => !open)}
                        className={`flex w-full items-center rounded-md px-2 py-2 text-sm font-medium border-l-4 ${
                            currentPath === '/credit-card-transactions' ||
                            currentPath === '/account-transactions'
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                    >
                        <span className='mr-3 text-lg'>💸</span>
                        Transactions
                        <span className='ml-auto'>
                            {transactionsOpen ? (
                                <svg
                                    className='w-4 h-4 inline'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className='w-4 h-4 inline'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M9 5l7 7-7 7'
                                    />
                                </svg>
                            )}
                        </span>
                    </button>
                    {transactionsOpen && (
                        <div className='ml-6 space-y-1'>
                            <button
                                onClick={() =>
                                    onViewChange('/credit-card-transactions')
                                }
                                className={`flex w-full items-center rounded-md px-2 py-2 text-sm font-medium border-l-4 ${
                                    currentPath === '/credit-card-transactions'
                                        ? 'bg-red-100 border-red-500 text-red-700'
                                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                            >
                                <span className='mr-3 text-lg'>💳</span>
                                Credit Cards
                            </button>
                            <button
                                onClick={() =>
                                    onViewChange('/account-transactions')
                                }
                                className={`flex w-full items-center rounded-md px-2 py-2 text-sm font-medium border-l-4 ${
                                    currentPath === '/account-transactions'
                                        ? 'bg-red-100 border-red-500 text-red-700'
                                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                            >
                                <span className='mr-3 text-lg'>🏦</span>
                                Accounts
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default MainLayout;
