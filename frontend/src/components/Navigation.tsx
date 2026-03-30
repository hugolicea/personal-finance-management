import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';

interface NavigationProps {
    onMenuClick?: () => void;
}

function Navigation({ onMenuClick }: NavigationProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    return (
        <div className='navbar bg-base-100 shadow-sm border-b border-base-300 lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-10 lg:h-16'>
            {/* Mobile hamburger */}
            <div className='flex-none lg:hidden'>
                <button
                    onClick={onMenuClick}
                    className='btn btn-ghost btn-circle'
                    aria-label='Open sidebar'
                >
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
            </div>

            {/* Logo */}
            <div className='flex-1'>
                <h1 className='text-xl font-bold px-2'>
                    💰 Personal Finance 365
                </h1>
            </div>

            {/* Desktop right section */}
            <div className='flex-none hidden lg:flex items-center gap-3'>
                {isAuthenticated ? (
                    <>
                        <span className='text-sm'>
                            Welcome,{' '}
                            <span className='font-medium'>
                                {user?.username || 'User'}
                            </span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className='btn btn-primary btn-sm'
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <span className='text-sm opacity-60'>
                        Professional Budget Management
                    </span>
                )}
            </div>
        </div>
    );
}

export default Navigation;
