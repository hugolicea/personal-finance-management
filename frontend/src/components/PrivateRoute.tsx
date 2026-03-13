import { Navigate } from 'react-router-dom';

import { useAppSelector } from '../hooks/redux';
import LoadingSpinner from './LoadingSpinner';

interface PrivateRouteProps {
    children: React.ReactElement;
}

function PrivateRoute({ children }: PrivateRouteProps) {
    const { isAuthenticated, authChecked } = useAppSelector(
        (state) => state.auth
    );

    // Still waiting for the initial cookie-based auth check
    if (!authChecked) {
        return <LoadingSpinner fullScreen message='Checking session...' />;
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    return children;
}

export default PrivateRoute;
