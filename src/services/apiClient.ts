import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { TokenStorage } from './TokenStorage';
import { TokenRefreshResponse } from '../types/api';

// Create Centralized Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Single in-flight refresh promise to prevent stampedes
let refreshPromise: Promise<string | null> | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export const setOnAuthFailure = (callback: () => void) => {
  onAuthFailureCallback = callback;
};

// Request Interceptor: Attach JWT Bearer Access Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token attachment for public auth endpoints
    const isPublicAuth =
      config.url?.includes(API_ENDPOINTS.AUTH_LOGIN) ||
      config.url?.includes(API_ENDPOINTS.AUTH_REGISTER) ||
      config.url?.includes(API_ENDPOINTS.AUTH_REFRESH);

    if (!isPublicAuth) {
      const tokens = await TokenStorage.getTokens();
      if (tokens?.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamless Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 and request has not been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Avoid looping if the refresh endpoint itself failed with 401
      if (originalRequest.url?.includes(API_ENDPOINTS.AUTH_REFRESH)) {
        await TokenStorage.clearTokens();
        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const tokens = await TokenStorage.getTokens();
            if (!tokens?.refresh) {
              return null;
            }

            try {
              // Direct Axios call to bypass interceptor loop
              const res = await axios.post<TokenRefreshResponse>(
                `${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`,
                { refresh: tokens.refresh },
                { headers: { 'Content-Type': 'application/json' } }
              );

              const newAccess = res.data.access;
              const newRefresh = res.data.refresh || tokens.refresh;
              await TokenStorage.saveTokens({ access: newAccess, refresh: newRefresh });
              return newAccess;
            } catch (refreshErr) {
              await TokenStorage.clearTokens();
              if (onAuthFailureCallback) {
                onAuthFailureCallback();
              }
              return null;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        const newAccessToken = await refreshPromise;
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);
