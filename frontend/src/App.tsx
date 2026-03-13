import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import MainLayout from './components/MainLayout';
import { useAppDispatch } from './hooks/redux';
import AppRoutes from './routes/AppRoutes';
import { RootState } from './store';
import { checkAuth } from './store/slices/authSlice';

function App() {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const isAuthPage =
        location.pathname === '/login' || location.pathname === '/register';
    const { isLoading, loadingMessage } = useSelector(
        (state: RootState) => state.loading
    );
    const { authChecked } = useSelector((state: RootState) => state.auth);

    // Verify cookie-based session on cold load — skip on auth pages to
    // avoid a 401 → attempted refresh → rejection loop when no cookies exist.
    useEffect(() => {
        if (!isAuthPage) {
            dispatch(checkAuth());
        }
    }, [dispatch, isAuthPage]);

    // Don't render routes until we know whether the user is authenticated
    // (prevents PrivateRoute from flashing /login on page refresh)
    if (!authChecked && !isAuthPage) {
        return <LoadingSpinner fullScreen message='Checking session...' />;
    }

    // Render auth pages without MainLayout
    if (isAuthPage) {
        return (
            <ErrorBoundary>
                <AppRoutes />
            </ErrorBoundary>
        );
    }

    // Render protected pages with MainLayout
    return (
        <ErrorBoundary>
            {isLoading && (
                <LoadingSpinner fullScreen message={loadingMessage} />
            )}
            <MainLayout />
        </ErrorBoundary>
    );
}

export default App;
