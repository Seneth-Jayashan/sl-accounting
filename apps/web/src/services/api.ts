import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// 1. Configuration
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// 2. Create Axios Instance
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Memory Token Management
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// 4. Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken) {
      config.headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 5. Response Interceptor (Concurrency Handling)
interface RetryQueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}

let isRefreshing = false;
let failedQueue: RetryQueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Auth-related URLs that should NEVER trigger a token refresh retry.
// This prevents infinite loops where a failing /refresh or /me call
// causes the interceptor to attempt another /refresh.
const AUTH_URLS_TO_SKIP = ["/auth/refresh", "/auth/login", "/auth/logout", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthUrl = AUTH_URLS_TO_SKIP.some((url) =>
      originalRequest?.url?.includes(url)
    );

    // Skip retry logic for:
    // 1. Network errors (no response)
    // 2. Non-401 errors
    // 3. Requests that already retried (_retry flag)
    // 4. Auth-specific URLs (prevents refresh loop)
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      isAuthUrl
    ) {
      return Promise.reject(error);
    }

    // --- TOKEN EXPIRED: Handle Refresh ---

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mark request as retried and start refreshing
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = response.data?.accessToken;

      if (!newAccessToken) {
        throw new Error("No access token returned from refresh");
      }

      setAccessToken(newAccessToken);

      // Notify AuthContext about the new token
      window.dispatchEvent(
        new CustomEvent("auth:token-refreshed", { detail: newAccessToken })
      );

      processQueue(null, newAccessToken);

      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);
      setAccessToken(null);

      // Notify AuthContext to redirect to login
      window.dispatchEvent(new Event("auth:session-expired"));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;