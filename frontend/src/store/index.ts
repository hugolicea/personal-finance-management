import { AnyAction, combineReducers, configureStore } from '@reduxjs/toolkit';

import loadingReducer from './loadingSlice';
import accountsReducer from './slices/accountsSlice';
import authReducer, { logout } from './slices/authSlice';
import backupReducer from './slices/backupSlice';
import budgetProgressReducer from './slices/budgetProgressSlice';
import categoriesReducer from './slices/categoriesSlice';
import cleanAndReclassifyReducer from './slices/cleanAndReclassifySlice';
import heritagesReducer from './slices/heritagesSlice';
import investmentsReducer from './slices/investmentsSlice';
import retirementAccountsReducer from './slices/retirementAccountsSlice';
import transactionsReducer from './slices/transactionsSlice';

const appReducer = combineReducers({
    accounts: accountsReducer,
    auth: authReducer,
    backup: backupReducer,
    budgetProgress: budgetProgressReducer,
    categories: categoriesReducer,
    cleanAndReclassify: cleanAndReclassifyReducer,
    heritages: heritagesReducer,
    investments: investmentsReducer,
    retirementAccounts: retirementAccountsReducer,
    transactions: transactionsReducer,
    loading: loadingReducer,
});

const rootReducer = (
    state: ReturnType<typeof appReducer> | undefined,
    action: AnyAction
) => {
    if (action.type === logout.pending.type) {
        // Reset all slices to initial state as soon as logout starts.
        return appReducer(undefined, action);
    }

    return appReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
