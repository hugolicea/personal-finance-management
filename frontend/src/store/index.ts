import { AnyAction, combineReducers, configureStore } from '@reduxjs/toolkit';

import authReducer, { logout } from './slices/authSlice';

const appReducer = combineReducers({
    auth: authReducer,
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
