import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import { api, setAccessToken } from "../services/api";
import ReactHotToast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// ------------ Types ------------
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "admin";
  isLocked?: boolean;
  phoneNumber?: string;
  profileImage?: string;
  batch?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    nearestPostOffice?: string;
  };
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  batch: string;
  profileImageFile?: File | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------ Helper: Error Parser ------------
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || defaultMessage;
  }
  return (error as Error).message || defaultMessage;
};

// ------------ Provider ------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Prevents double-firing in React Strict Mode
  const isInitialized = useRef(false);

  // Keep the token helper in sync whenever state changes
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  // ----------- Logout (Memoized) -----------
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore — we always clear local state regardless
    } finally {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      window.location.href = "/login";
    }
  }, []);

  // ----------- Session Expiry Listener -----------
  // Connects AuthContext to the Axios interceptor's "auth:session-expired" event
  useEffect(() => {
    const handleSessionExpired = () => logout();
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [logout]);

  // ----------- Token Refresh Listener -----------
  // Keeps in-memory token state in sync when interceptor silently refreshes
  useEffect(() => {
    const handleTokenRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setAccessTokenState(customEvent.detail);
    };
    window.addEventListener("auth:token-refreshed", handleTokenRefresh);
    return () =>
      window.removeEventListener("auth:token-refreshed", handleTokenRefresh);
  }, []);

  // ----------- Initialization: Restore Session -----------
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        // Step 1: Attempt to get a new access token using the HTTP-only refresh cookie
        const refreshRes = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data?.accessToken;

        if (!newAccessToken) {
          // No token returned — user is simply not logged in. Not an error.
          return;
        }

        // Step 2: Synchronously set the token in the closure BEFORE any further calls.
        // This prevents the /me request from having a missing Authorization header,
        // which would cause a 401 → interceptor → second /refresh → token reuse → 403 loop.
        setAccessTokenState(newAccessToken);
        setAccessToken(newAccessToken);

        // Step 3: Fetch the user profile using raw axios with the token set manually.
        // We deliberately bypass the `api` instance here to avoid the response interceptor,
        // which could otherwise trigger another refresh cycle if /me returns 401.
        const userRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          withCredentials: true,
        });

        if (userRes.data?.success) {
          setUser(userRes.data.user);
        } else {
          throw new Error("Failed to fetch user profile after token refresh");
        }
      } catch (err: any) {
        const status = err.response?.status;

        if (status === 401 || status === 403) {
          // Token was explicitly rejected by the server — clear the session silently
          setAccessTokenState(null);
          setUser(null);
          setAccessToken(null);
        } else if (err.message !== "Failed to fetch user profile after token refresh") {
          // Only show a toast for genuine network / server errors, not auth failures
          console.error("Session restoration error:", err);
          ReactHotToast.error(
            getErrorMessage(err, "Failed to restore session. Please try again.")
          );
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ----------- Actions -----------

  const fetchMe = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user details", error);
    }
  };

  const login = async (payload: LoginPayload) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        const token = res.data.accessToken;

        // Set token synchronously before calling fetchMe
        setAccessTokenState(token);
        setAccessToken(token);

        if (res.data.user) {
          setUser(res.data.user);
        }

        // Hydrate full user profile (address, batch, etc.) after login
        await fetchMe();
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const form = new FormData();
      form.append("firstName", payload.firstName);
      form.append("lastName", payload.lastName);
      form.append("email", payload.email);
      form.append("password", payload.password);
      form.append("phoneNumber", payload.phoneNumber);
      form.append("batch", payload.batch);

      if (payload.profileImageFile) {
        form.append("profileImage", payload.profileImageFile);
      }

      await axios.post(`${API_BASE}/auth/register`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, "Registration failed"));
    }
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      fetchMe,
      updateUser,
    }),
    [user, accessToken, loading, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// ------------ Hook ------------
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthProvider;