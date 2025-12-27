import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// --- Context & Protected Route Wrapper ---
import AuthProvider from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// --- Layouts & Components ---
import { MainLayout } from "./layouts/MainLayout";
import { SplashScreen } from "./components/SplashScreen";

// --- Route Modules ---
import { AdminRoutes } from "./routes/AdminRoutes";
import { StudentRoutes } from "./routes/StudentRoutes";

// --- Public Pages (Keep these standard import for faster initial paint) ---
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

import AuthProvider from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import StudentDashboardPage from "./pages/student/Dashboard";
import StudentTicketPage from "./pages/student/Ticket";
import ViewKnowledgeBasePage from "./pages/student/KnowledgeBasestudent";

import StudentClassPage from "./pages/student/class/Classes";
import StudentViewClassPage from "./pages/student/class/ViewClass";

import EnrollmentPage from "./pages/student/enrollment/Enrollment";
import ViewEnrollmentPage from "./pages/student/enrollment/ViewEnrollment";
import UploadPaymentSlipPage from "./pages/student/enrollment/UploadPaymentSlip";

import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminStudentsPage from "./pages/admin/students/Students";
import ViewStudentPage from "./pages/admin/students/ViewStudent";
import UpdateStudentPage from "./pages/admin/students/UpdateStudent";

import AdminClassesPage from "./pages/admin/classes/Class";
import AdminSupportPage from "./pages/admin/support/SupportReply";
import AdminTicketReply from "./pages/admin/support/TicketChat";
import AdminClassesCreatePage from "./pages/admin/classes/CreateClass";
import AdminClassesViewPage from "./pages/admin/classes/ViewClass";
import AdminClassesUpdatePage from "./pages/admin/classes/UpdateClass";
import AdminKnowledgeBasePage from "./pages/admin/KnowledgeBase/KnowledgeBase";
import AdminKnowledgeListPage from "./pages/admin/KnowledgeBase/KnowledgeList";

import AdminSessionPage from "./pages/admin/sessions/Session";
import AdminCreateSessionPage from "./pages/admin/sessions/AddSession";

import AdminBatchPage from "./pages/admin/batches/Batch";
import AdminBatchViewPage from "./pages/admin/batches/ViewBatch";

import AdminEnrollmentPage from "./pages/admin/enrollments/Enrollment";
// import AdminEnrollmentViewPage from "./pages/admin/enrollments/ViewEnrollment";

import AdminPaymentsPage from "./pages/admin/payments/Payments";
// import AdminViewPaymentPage from "./pages/admin/payments/ViewPayment";
// import AdminPaymentVerificationPage from "./pages/admin/enrollments/PaymentVerification";

import "./index.css";

function App() {
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
            <Route path="/chat/:ticketId" element={<Chat />} />
          </Route>

          {/* ================= STUDENT MODULE ================= */}
          {/* Security: We use '/*' to delegate all sub-routes to StudentRoutes.
             The ProtectedRoute ensures only 'student' role can enter this section.
          */}
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentRoutes />
              </ProtectedRoute>
            } 
          />

          {/* ================= ADMIN MODULE ================= */}
          {/* Security: Uses '/*' to delegate. Only 'admin' role can enter.
             The code for these pages is NOT downloaded unless the user is an admin.
          */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRoutes />
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