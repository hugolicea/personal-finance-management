import { useLocation } from 'react-router-dom';

import MainLayout from './components/MainLayout';
import AppRoutes from './routes/AppRoutes';

function App() {
    const location = useLocation();
    const isAuthPage =
        location.pathname === '/login' || location.pathname === '/register';

    // Render auth pages without MainLayout
    if (isAuthPage) {
        return <AppRoutes />;
    }

    // Render protected pages with MainLayout
    return <MainLayout />;
}

export default App;
