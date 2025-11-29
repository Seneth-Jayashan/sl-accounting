import axios from "axios";

// 1. Configuration
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

// 2. Create Axios Instance
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Sends cookies (refresh token)
  headers: {
    "Accept": "application/json",
  },
});

// 3. Memory Token Management
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// 4. Request Interceptor: Attach Access Token
api.interceptors.request.use((config) => {
  if (inMemoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

// 5. Response Interceptor: Handle 401 & Refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    
    // Check if error is 401 and we haven't retried yet
    if (err.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint using a clean axios instance to avoid loops
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.accessToken;
        
        // Update token
        setAccessToken(newAccessToken);
        
        // Process queued requests
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        setAccessToken(null);
        // We reject here to let the UI know the session expired
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;