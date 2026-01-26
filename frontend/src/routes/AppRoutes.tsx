import { Route, Routes } from 'react-router-dom';

import Categories from '../pages/Categories';
import Dashboard from '../pages/Dashboard';
import Reports from '../pages/Reports';
import Transactions from '../pages/Transactions';

function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path='/transactions' element={<Transactions />} />
            <Route path='/categories' element={<Categories />} />
            <Route path='/reports' element={<Reports />} />
        </Routes>
    );
}

export default AppRoutes;
