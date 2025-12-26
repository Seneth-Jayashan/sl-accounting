import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import axios from "axios";
import { api, setAccessToken } from "../services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// ------------ Types ------------
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "admin";
  phoneNumber?: string;
  profileImage?: string;
  batch?: string; // --- UPDATE: Added batch here likely needed for UI
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
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ref to prevent double-firing in React Strict Mode
  const isInitialized = useRef(false);

  // Sync the Token Helper whenever state changes
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  // --- NEW: LOGOUT FUNCTION (Memoized) ---
  // We memoize this so it can be used in the event listener effect below
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Ignore errors
    } finally {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      window.location.href = "/login"; 
    }
  }, []);

  // --- NEW: SESSION EXPIRY LISTENER ---
  // This connects the AuthContext to the Axios Interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [logout]);

  // INITIALIZATION: Restore Session
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true } 
        );

        const newAccessToken = res.data?.accessToken;

        if (newAccessToken) {
          setAccessTokenState(newAccessToken);
          setAccessToken(newAccessToken); 
          
          // Fetch user details
          const userRes = await api.get("/auth/me");
          if (userRes.data?.success) {
            setUser(userRes.data.user);
          } else {
             // If we have a token but can't get user, something is wrong. Logout.
             throw new Error("Failed to fetch user");
          }
        }
      } catch (err) {
        setAccessTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // --------- Actions ----------

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
        setAccessTokenState(token);
        setAccessToken(token);

        if (res.data.user) {
          setUser(res.data.user);
        } else {
          await fetchMe();
        }
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, "Login failed"));
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
        withCredentials: true 
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ------------ Hook ------------
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthProvider;