import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import MainLayout from './components/MainLayout';
import AppRoutes from './routes/AppRoutes';
import { RootState } from './store';

function App() {
    const location = useLocation();
    const isAuthPage =
        location.pathname === '/login' || location.pathname === '/register';
    const { isLoading, loadingMessage } = useSelector(
        (state: RootState) => state.loading
    );

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
