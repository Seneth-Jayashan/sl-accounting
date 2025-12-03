import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import axios, { AxiosError } from "axios";
import { api, setAccessToken } from "../services/api"; 

// ------------ Types ------------
export type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  profileImage?: string | null;
  [k: string]: any;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Base URL for direct axios calls (skipping interceptors)
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

// ------------ Provider ------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Prevent double execution in React Strict Mode
  const isCheckingAuth = useRef(false);

  // Sync module-level token whenever state changes
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  // INITIALIZATION: Check for Refresh Token Cookie ONCE on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;

      console.log("AuthContext: Starting Initialization...");

      try {
        // Use base 'axios' to avoid interceptor loops during initialization
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true } 
        );

        const newAccessToken = res.data?.accessToken;

        if (newAccessToken) {
          console.log("AuthContext: Session Restored");
          setAccessToken(newAccessToken); 
          setAccessTokenState(newAccessToken);
          
          // Now fetch user details using the authenticated 'api' instance
          // We call api.get directly here to avoid circular dependency in fetchMe
          const userRes = await api.get("/auth/me");
          if(userRes.data?.success) {
            setUser(userRes.data.user);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        // Silent fail: User is simply not logged in.
        console.log("AuthContext: No active session."); 
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
      console.error("AuthContext: fetchMe failed", error);
      // Optional: If fetchMe fails with 401, the interceptor handles logout usually
    }
  };

  const login = async (payload: { email: string; password: string }) => {
    try {
      // 🔴 CHANGE: Use 'axios' instead of 'api'.
      // This bypasses the interceptor. If password is wrong (401), 
      // it throws immediately instead of trying to /refresh.
      const res = await axios.post(`${API_BASE}/auth/login`, payload, {
        withCredentials: true // Important: To set the HttpOnly cookie
      });

      if (res.data?.success) {
        const token: string | null = res.data.accessToken ?? null;
        setAccessTokenState(token);
        setAccessToken(token);

        if (res.data.user) {
          setUser(res.data.user);
        } else {
          await fetchMe();
        }
      } else {
        throw new Error(res.data?.message ?? "Login failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError;
        // This will now correctly show "Invalid Credentials" instead of "No token provided"
        throw new Error(
          (axiosErr.response?.data as any)?.message ?? axiosErr.message ?? "Login error"
        );
      }
      throw error;
    }
  };

  const register = async (payload: any) => {
    try {
      const form = new FormData();
      // ... (Your FormData logic remains the same)
      form.append("firstName", payload.firstName);
      if (payload.lastName) form.append("lastName", payload.lastName);
      form.append("email", payload.email);
      form.append("password", payload.password);
      if (payload.phoneNumber) form.append("phoneNumber", payload.phoneNumber);
      if (payload.profileImageFile) form.append("profileImage", payload.profileImageFile);

      Object.keys(payload).forEach((key) => {
        if (!["firstName", "lastName", "email", "password", "phoneNumber", "profileImageFile"].includes(key)) {
          const val = (payload as any)[key];
          if (val !== undefined && val !== null) form.append(key, String(val));
        }
      });

      // 🔴 CHANGE: Use 'axios' here too for safety
      const res = await axios.post(`${API_BASE}/auth/register`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true 
      });

      if (res.data?.success) {
        return;
      } else {
        throw new Error(res.data?.message ?? "Registration failed");
      }
    } catch (error) {
       // ... (Error handling remains the same)
       if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError;
        const errorData = axiosErr.response?.data as any;
        const msg = errorData?.message || "Registration error";
        throw new Error(msg);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Use 'api' here because we want to send the token if we have it
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout API call failed, clearing local state anyway.");
    } finally {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
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
    [user, accessToken, loading]
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