// App.tsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contacts from "./pages/Contacts";
import { MainLayout } from "./layouts/MainLayout";
import { SplashScreen } from "./components/SplashScreen";
import ForgotPassword from "./pages/ForgotPassword";
import Verification from "./pages/Verification";

import Chat from "./components/Chat";



import AuthProvider from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute"; 

import StudentDashboardPage from "./pages/student/Dashboard";
import StudentTicketPage from "./pages/student/Ticket";


import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminStudentsPage from "./pages/admin/students/Students";
import ViewStudentPage from "./pages/admin/students/ViewStudent";
import UpdateStudentPage from "./pages/admin/students/UpdateStudent";
import AdminClassesPage from "./pages/admin/classes/Class";
import AdminSupportPage from "./pages/admin/SupportReply";

import "./index.css";

function App() {
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
      <BrowserRouter>
        {/* Splash intro */}
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen
              key="splash"
              onComplete={handleSplashComplete}
            />
          )}
        </AnimatePresence>

        {/* Main app routes */}
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/chat/:ticketId" element={<Chat />} />
            
            
            
          </Route>

          {/* Protected routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tickets"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentTicketPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/support"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSupportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ViewStudentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UpdateStudentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminClassesPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
