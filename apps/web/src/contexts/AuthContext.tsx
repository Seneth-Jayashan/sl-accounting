import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { api, setAccessToken } from "../services/api"; // Import from your new service file

// ------------ Types ------------
export type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  profileImage?: string | null;
  [k: string]: any;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    profileImageFile?: File | null;
    [k: string]: any;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------ Provider ------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync module-level token
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  // INITIALIZATION: Check for Refresh Token Cookie
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // We use the base axios (not 'api') to check refresh status once on mount
        const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
        
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.accessToken;

        if (newAccessToken) {
          setAccessToken(newAccessToken); // Update service
          setAccessTokenState(newAccessToken); // Update State
          await fetchMe(); // Fetch User
        } else {
          setUser(null);
        }
      } catch (err) {
        // User is not logged in (no cookie or expired)
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- Actions ----------
  const fetchMe = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (payload: { email: string; password: string }) => {
    try {
      const res = await api.post("/auth/login", payload);
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
        throw new Error(
          // Fix: Ensure we extract the message string, not an object
          (axiosErr.response?.data as any)?.message ?? axiosErr.message ?? "Login error"
        );
      }
      throw error;
    }
  };

  const register = async (payload: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    profileImageFile?: File | null;
    [k: string]: any;
  }) => {
    try {
      const form = new FormData();
      form.append("firstName", payload.firstName);
      if (payload.lastName) form.append("lastName", payload.lastName);
      form.append("email", payload.email);
      form.append("password", payload.password);
      if (payload.phoneNumber) form.append("phoneNumber", payload.phoneNumber);
      if (payload.profileImageFile) form.append("profileImage", payload.profileImageFile);

      Object.keys(payload).forEach((key) => {
        if (
          !["firstName", "lastName", "email", "password", "phoneNumber", "profileImageFile"].includes(
            key
          )
        ) {
          const val = (payload as any)[key];
          if (val !== undefined && val !== null) form.append(key, String(val));
        }
      });

      const res = await api.post("/auth/register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        return;
      } else {
        throw new Error(res.data?.message ?? "Registration failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError;
        // Fix: Properly extract error message from object response
        const errorData = axiosErr.response?.data as any;
        const msg = 
          errorData?.message || 
          (errorData?.errors ? JSON.stringify(errorData.errors) : null) ||
          axiosErr.message ||
          "Registration error";
        
        throw new Error(msg);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // ignore
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