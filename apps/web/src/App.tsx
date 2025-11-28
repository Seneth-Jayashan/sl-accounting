// App.tsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";   // 👈 import this
import StudentDashboardPage from "./pages/student/Dashboard";
import AdminDashboardPage from "./pages/admin/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { MainLayout } from "./layouts/MainLayout";
import { SplashScreen } from "./components/SplashScreen";
import ForgotPassword from "./pages/ForgotPassword";
import "./index.css";

function App() {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("hasSeenSplash") !== "true";
  });

  const handleSplashComplete = () => {
    localStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false); // <- this triggers exit animation
  };

  return (
    <BrowserRouter>
      {/* AnimatePresence handles smooth unmount */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen
            key="splash"
            onComplete={handleSplashComplete}
          />
        )}
      </AnimatePresence>

      {/* Your app is already behind the splash, it just becomes visible as it fades out */}
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
