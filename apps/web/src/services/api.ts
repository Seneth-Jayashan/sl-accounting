import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// 1. Configuration
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// 2. Create Axios Instance
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial: Ensures Refresh Token cookie is sent
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Memory Token Management
// Security: Keeping this in a closure prevents XSS attacks from reading it
// (unlike localStorage).
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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no response (network error) or not 401, reject immediately
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // SCENARIO: Token Expired. Handle Refresh.

    // 1. If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          // When resolved, update header and retry
          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // 2. Start Refreshing
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use raw axios to prevent infinite loops
      const response = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = response.data?.accessToken;
      setAccessToken(newAccessToken);

      window.dispatchEvent(
        new CustomEvent("auth:token-refreshed", { detail: newAccessToken })
      );

      // Process the queue with the new token
      processQueue(null, newAccessToken);

      // Retry the original failing request
      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      return api(originalRequest);
    } catch (refreshError) {
      // 3. Refresh Failed (Session completely dead)
      processQueue(refreshError as Error, null);
      setAccessToken(null);

      // Trigger a custom event so the UI (React) knows to redirect to Login
      // This decouples the API file from React Router
      window.dispatchEvent(new Event("auth:session-expired"));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// 6. Error Display Interceptor (Optional - Auto-show errors as toasts)
// Uncomment to enable automatic error toast display
// This will show all errors to the user automatically
// Set 'skipErrorDisplay: true' in request config to skip for specific requests
/*
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config as InternalAxiosRequestConfig & { skipErrorDisplay?: boolean };
    
    // Skip error display if requested
    if (config?.skipErrorDisplay) {
      return Promise.reject(error);
    }

    // Dynamic import toast to avoid circular dependencies
    import("react-hot-toast").then(({ default: toast }) => {
      const response = error.response;
      
      if (response?.data?.message) {
        toast.error(response.data.message, {
          duration: 4000,
          position: "top-right",
        });
      } else if (!response) {
        toast.error("Unable to connect to server. Please check your internet connection.", {
          duration: 4000,
        });
      }
    });

    return Promise.reject(error);
  }
);
*/

export default api;
