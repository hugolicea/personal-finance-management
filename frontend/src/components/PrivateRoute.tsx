import { Navigate } from 'react-router-dom';

import { useAppSelector } from '../hooks/redux';

interface PrivateRouteProps {
    children: React.ReactElement;
}

function PrivateRoute({ children }: PrivateRouteProps) {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    return children;
}

export default PrivateRoute;
