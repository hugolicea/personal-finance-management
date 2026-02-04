import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import * as Sentry from '@sentry/react';
import axios from 'axios';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { store } from './store';

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

// Configure axios baseURL from environment variable
const apiBaseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL =
    apiBaseURL !== undefined ? apiBaseURL : 'http://localhost:8000';
axios.defaults.timeout = 30000; // 30 seconds timeout
axios.defaults.withCredentials = true; // Send cookies with requests

// Add axios request interceptor to include JWT token and CSRF token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Get CSRF token from cookie
        const csrfToken = document.cookie
            .split('; ')
            .find((row) => row.startsWith('csrftoken='))
            ?.split('=')[1];

        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
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
