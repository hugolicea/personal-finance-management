import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import axios from 'axios';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { store } from './store';

// Configure axios baseURL from environment variable
axios.defaults.baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
axios.defaults.timeout = 30000; // 30 seconds timeout

// Add axios request interceptor to include JWT token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add axios response interceptor to handle 401 errors
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't retry if already retried or if it's a refresh token request
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/token/refresh/')
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        '/api/v1/auth/token/refresh/',
                        {
                            refresh: refreshToken,
                        }
                    );
                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return axios(originalRequest);
                } catch (refreshError) {
                    // Refresh token failed, clear credentials and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    if (
                        window.location.pathname !== '/login' &&
                        window.location.pathname !== '/register'
                    ) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, clear any stale access token and redirect to login
                localStorage.removeItem('accessToken');
                if (
                    window.location.pathname !== '/login' &&
                    window.location.pathname !== '/register'
                ) {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <Provider store={store}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </Provider>
        </ErrorBoundary>
    </React.StrictMode>
);
