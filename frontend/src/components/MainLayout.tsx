import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import FloatingActionButton from './FloatingActionButton';
import SkipLinks from './SkipLinks';
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
        <div className='drawer lg:drawer-open min-h-screen'>
            <SkipLinks />
            <input
                id='sidebar-drawer'
                type='checkbox'
                className='drawer-toggle'
                checked={sidebarOpen}
                onChange={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main content area */}
            <div className='drawer-content flex flex-col bg-base-200 h-screen overflow-hidden'>
                <Navigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main
                    id='main-content'
                    tabIndex={-1}
                    className='flex-1 overflow-y-auto'
                >
                    <div className='py-6'>
                        <div className='mx-auto max-w-screen-2xl px-4 sm:px-6 xl:px-8'>
                            <AppRoutes />
                        </div>
                    </div>
                </main>
                <FloatingActionButton />
            </div>

            {/* Sidebar */}
            <div className='drawer-side z-50'>
                <label
                    htmlFor='sidebar-drawer'
                    aria-label='close sidebar'
                    className='drawer-overlay'
                    onClick={() => setSidebarOpen(false)}
                />
                <div className='bg-base-100 w-64 min-h-full shadow flex flex-col'>
                    <SidebarContent
                        currentPath={location.pathname}
                        onViewChange={handleViewChange}
                    />
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
    const menuItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/accounts', label: 'Accounts', icon: '🏦' },
        { path: '/categories', label: 'Categories', icon: '🏷️' },
        { path: '/investments', label: 'Investments', icon: '📈' },
        { path: '/heritage', label: 'Heritage', icon: '🏠' },
        { path: '/retirement', label: 'Retirement', icon: '🏖️' },
        { path: '/balance', label: 'Balance', icon: '⚖️' },
        { path: '/reports', label: 'Reports', icon: '📊' },
        {
            path: '/clean-and-reclassify',
            label: 'Clean & Reclassify',
            icon: '🧹',
        },
        { path: '/backup', label: 'Backup & Restore', icon: '💾' },
        { path: '/tools', label: 'Financial Tools', icon: '🧮' },
    ];

    const isAccountsActive =
        currentPath === '/accounts' || currentPath.startsWith('/accounts/');

    return (
        <nav className='mt-4 flex-1'>
            <ul className='menu px-3 space-y-0.5'>
                {menuItems.map((item) => {
                    const isActive =
                        item.path === '/accounts'
                            ? isAccountsActive
                            : currentPath === item.path;
                    return (
                        <li key={item.path}>
                            <button
                                onClick={() => onViewChange(item.path)}
                                className={
                                    isActive
                                        ? 'active font-medium'
                                        : 'font-medium'
                                }
                            >
                                <span className='text-lg'>{item.icon}</span>
                                {item.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default MainLayout;
