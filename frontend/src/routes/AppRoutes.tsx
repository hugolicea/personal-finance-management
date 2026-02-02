import { Route, Routes } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import AccountTransactions from '../pages/AccountTransactions';
import Categories from '../pages/Categories';
import CreditCardTransactions from '../pages/CreditCardTransactions';
import Dashboard from '../pages/Dashboard';
import Heritage from '../pages/Heritage';
import Investments from '../pages/Investments';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Reports from '../pages/Reports';
import Retirement from '../pages/Retirement';

function AppRoutes() {
    return (
        <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route
                path='/'
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path='/credit-card-transactions'
                element={
                    <PrivateRoute>
                        <CreditCardTransactions />
                    </PrivateRoute>
                }
            />
            <Route
                path='/account-transactions'
                element={
                    <PrivateRoute>
                        <AccountTransactions />
                    </PrivateRoute>
                }
            />
            <Route
                path='/categories'
                element={
                    <PrivateRoute>
                        <Categories />
                    </PrivateRoute>
                }
            />
            <Route
                path='/investments'
                element={
                    <PrivateRoute>
                        <Investments />
                    </PrivateRoute>
                }
            />
            <Route
                path='/heritage'
                element={
                    <PrivateRoute>
                        <Heritage />
                    </PrivateRoute>
                }
            />
            <Route
                path='/retirement'
                element={
                    <PrivateRoute>
                        <Retirement />
                    </PrivateRoute>
                }
            />
            <Route
                path='/reports'
                element={
                    <PrivateRoute>
                        <Reports />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}

export default AppRoutes;
