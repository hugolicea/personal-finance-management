import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';

import apiClient from '../../utils/apiClient';

interface User {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    // checkAuth runs once on app mount; while pending we show a spinner
    // so PrivateRoute doesn't flash the login page before auth is verified.
    authChecked: boolean;
    error: string | null;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    username: string;
    email: string;
    password1: string;
    password2: string;
}

interface AuthResponse {
    user: User;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    authChecked: false,
    error: null,
};

/**
 * Verify auth state on app mount by hitting /auth/user/.
 * The browser automatically sends the HttpOnly jwt-access cookie.
 * If the cookie is missing/expired and refresh also fails, the
 * apiClient interceptor will redirect to /login.
 */
export const checkAuth = createAsyncThunk<User>(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/api/v1/auth/user/');
            return response.data;
        } catch {
            return rejectWithValue(null);
        }
    }
);

// Login user — server sets HttpOnly jwt-access & jwt-refresh cookies
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/auth/login/',
                credentials
            );
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data?.detail || 'Login failed'
                );
            }
            return rejectWithValue('Login failed');
        }
    }
);

// Register user — server sets HttpOnly cookies on success
export const register = createAsyncThunk<AuthResponse, RegisterData>(
    'auth/register',
    async (data, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(
                '/api/v1/auth/registration/',
                data
            );
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data || 'Registration failed'
                );
            }
            return rejectWithValue('Registration failed');
        }
    }
);

// Logout user — ask server to clear the HttpOnly cookies.
// Always clears local auth state even if the server call fails
// (e.g. expired tokens when the user sat idle too long).
export const logout = createAsyncThunk('auth/logout', async () => {
    try {
        await apiClient.post('/api/v1/auth/logout/');
    } catch {
        // Swallow the error — we clear local state regardless
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCredentials: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // checkAuth
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.authChecked = true;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.authChecked = true;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.authChecked = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.authChecked = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Logout — clear auth state immediately (pending) so PrivateRoute
            // redirects to /login before any dashboard fetch effects can fire.
            .addCase(logout.pending, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            })
            // Logout — always clear state whether server succeeded or not
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logout.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            });
    },
});

export const { clearError, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
