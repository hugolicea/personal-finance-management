import { Route, Routes } from 'react-router-dom';

import AccountTransactions from '../pages/AccountTransactions';
import Categories from '../pages/Categories';
import CreditCardTransactions from '../pages/CreditCardTransactions';
import Dashboard from '../pages/Dashboard';
import Heritage from '../pages/Heritage';
import Investments from '../pages/Investments';
import Reports from '../pages/Reports';
import Retirement from '../pages/Retirement';

function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route
                path='/credit-card-transactions'
                element={<CreditCardTransactions />}
            />
            <Route
                path='/account-transactions'
                element={<AccountTransactions />}
            />
            <Route path='/categories' element={<Categories />} />
            <Route path='/investments' element={<Investments />} />
            <Route path='/heritage' element={<Heritage />} />
            <Route path='/retirement' element={<Retirement />} />
            <Route path='/reports' element={<Reports />} />
        </Routes>
    );
}

export default AppRoutes;
