import { configureStore } from '@reduxjs/toolkit';

import categoriesReducer from './slices/categoriesSlice';
import heritagesReducer from './slices/heritagesSlice';
import investmentsReducer from './slices/investmentsSlice';
import retirementAccountsReducer from './slices/retirementAccountsSlice';
import transactionsReducer from './slices/transactionsSlice';

export const store = configureStore({
    reducer: {
        categories: categoriesReducer,
        heritages: heritagesReducer,
        investments: investmentsReducer,
        retirementAccounts: retirementAccountsReducer,
        transactions: transactionsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
