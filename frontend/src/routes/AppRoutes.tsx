import { Route, Routes } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import AccountsList from '../pages/AccountsList';
import AccountTransactionsPage from '../pages/AccountTransactionsPage';
import Balance from '../pages/Balance';
import BudgetProgress from '../pages/BudgetProgress';
import Categories from '../pages/Categories';
import CleanAndReclassify from '../pages/CleanAndReclassify';
import CompoundInterestCalculator from '../pages/CompoundInterestCalculator';
import Dashboard from '../pages/Dashboard';
import DatabaseBackup from '../pages/DatabaseBackup';
import FinancialTools from '../pages/FinancialTools';
import Heritage from '../pages/Heritage';
import Investments from '../pages/Investments';
import LoanCalculator from '../pages/LoanCalculator';
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
                path='/accounts'
                element={
                    <PrivateRoute>
                        <AccountsList />
                    </PrivateRoute>
                }
            />
            <Route
                path='/accounts/:accountId'
                element={
                    <PrivateRoute>
                        <AccountTransactionsPage />
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
            <Route
                path='/balance'
                element={
                    <PrivateRoute>
                        <Balance />
                    </PrivateRoute>
                }
            />
            <Route
                path='/budget-progress'
                element={
                    <PrivateRoute>
                        <BudgetProgress />
                    </PrivateRoute>
                }
            />
            <Route
                path='/clean-and-reclassify'
                element={
                    <PrivateRoute>
                        <CleanAndReclassify />
                    </PrivateRoute>
                }
            />
            <Route
                path='/backup'
                element={
                    <PrivateRoute>
                        <DatabaseBackup />
                    </PrivateRoute>
                }
            />
            <Route
                path='/tools'
                element={
                    <PrivateRoute>
                        <FinancialTools />
                    </PrivateRoute>
                }
            />
            <Route
                path='/tools/compound-interest'
                element={
                    <PrivateRoute>
                        <CompoundInterestCalculator />
                    </PrivateRoute>
                }
            />
            <Route
                path='/tools/loan-calculator'
                element={
                    <PrivateRoute>
                        <LoanCalculator />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}

export default AppRoutes;
