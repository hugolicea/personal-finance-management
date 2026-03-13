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
                    .then(() => {
                        refreshPromise = null;
                    })
                    .catch((refreshError) => {
                        refreshPromise = null;
                        return Promise.reject(refreshError);
                    });
            }

            try {
                await refreshPromise;
                return apiClient(originalRequest);
            } catch {
                // Refresh failed — let React Router handle the redirect via
                // PrivateRoute; just propagate the rejection.
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
