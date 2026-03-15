import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

/**
 * Axios instance that automatically sends the HttpOnly JWT cookies on every
 * request (`withCredentials: true`) and silently refreshes the access token
 * when a 401 is received, then retries the original request once.
 *
 * Token storage in HttpOnly cookies means JS never has direct access to the
 * tokens — the browser attaches them automatically and they cannot be read
 * by client-side scripts (XSS protection).
 *
 * When the refresh token itself is expired or invalid, the interceptor fires
 * a `auth:session-expired` CustomEvent on `window` so the app can clear
 * Redux auth state and redirect to /login without a circular dependency on
 * the Redux store.
 */

const apiClient: AxiosInstance = axios.create({
    withCredentials: true, // send HttpOnly JWT cookies on every request
});

// Track the in-flight refresh promise so concurrent 401s don't race
let refreshPromise: Promise<void> | null = null;

// Extend config type to carry retry flag
interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryConfig;

        // IMPORTANT: never try to refresh if:
        //   - the failing request IS the refresh endpoint itself (avoids deadlock)
        //   - the failing request is logout (tokens gone anyway, just let it fail)
        //   - we already retried once
        const isRefreshEndpoint = originalRequest.url?.includes(
            '/auth/token/refresh/'
        );
        const isLogoutEndpoint = originalRequest.url?.includes('/auth/logout/');

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isRefreshEndpoint &&
            !isLogoutEndpoint
        ) {
            originalRequest._retry = true;

            // If a refresh is already in-flight, wait for it rather than
            // making a second simultaneous refresh request.
            if (!refreshPromise) {
                refreshPromise = apiClient
                    .post('/api/v1/auth/token/refresh/')
                    .then(() => {})
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            try {
                await refreshPromise;
                return apiClient(originalRequest);
            } catch {
                // Both access and refresh tokens are expired — clear Redux auth
                // state so PrivateRoute can redirect to /login. We use a
                // CustomEvent to avoid a circular dependency
                // (store → slices → apiClient → store).
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
