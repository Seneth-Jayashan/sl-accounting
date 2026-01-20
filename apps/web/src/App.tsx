import { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { RotateCw } from "lucide-react"; 
import { Toaster } from "react-hot-toast"; // <--- 1. Import Toaster

// --- Context & Protected Route Wrapper ---
import AuthProvider from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// --- Custom Hooks ---
import { useRightClickProtection } from "./hooks/useRightClickProtection"; // <--- 2. Import the Hook

// --- Layouts & Components ---
import { MainLayout } from "./layouts/MainLayout";
import { SplashScreen } from "./components/SplashScreen";

// --- Public Pages ---
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contacts from "./pages/Contacts";
import Classes from "./pages/Classes";
import ViewClassPage from "./pages/ViewClass";
import ForgotPassword from "./pages/ForgotPassword";
import Verification from "./pages/Verification";
import Chat from "./components/Chat";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import "./index.css";

// --- LAZY LOADED MODULES ---
const AdminRoutes = lazy(() => 
  import("./routes/AdminRoutes").then(module => ({ default: module.AdminRoutes }))
);

const StudentRoutes = lazy(() => 
  import("./routes/StudentRoutes").then(module => ({ default: module.StudentRoutes }))
);

// Simple Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <RotateCw className="w-10 h-10 text-brand-prussian animate-spin mb-4" />
    <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Module...</p>
  </div>
);

function App() {
  // <--- 3. Activate Right Click Protection ---
  useRightClickProtection();

  // Splash Screen Logic
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("hasSeenSplash") !== "true";
  });

  const handleSplashComplete = () => {
    localStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  return (
    <AuthProvider>
      {/* <--- 4. Add Toaster Global Component --- */}
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            zIndex: 9999, // Ensure it sits above modals/splash screen
          },
        }}
      />

      <BrowserRouter>
        {/* --- Splash Screen --- */}
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen key="splash" onComplete={handleSplashComplete} />
          )}
        </AnimatePresence>

        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ViewClassPage />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/chat/:ticketId" element={<Chat />} />
          </Route>

          {/* ================= STUDENT MODULE (Lazy Loaded) ================= */}
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Suspense fallback={<PageLoader />}>
                  <StudentRoutes />
                </Suspense>
              </ProtectedRoute>
            } 
          />

          {/* ================= ADMIN MODULE (Lazy Loaded) ================= */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Suspense fallback={<PageLoader />}>
                  <AdminRoutes />
                </Suspense>
              </ProtectedRoute>
            } 
          />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;