// App.tsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contacts from "./pages/Contacts";
import Classes from "./pages/Classes";
import ViewClassPage from "./pages/ViewClass";
import { MainLayout } from "./layouts/MainLayout";
import { SplashScreen } from "./components/SplashScreen";
import ForgotPassword from "./pages/ForgotPassword";
import Verification from "./pages/Verification";

import Chat from "./components/Chat";



import AuthProvider from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute"; 

import StudentDashboardPage from "./pages/student/Dashboard";
import StudentTicketPage from "./pages/student/Ticket";

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

import AdminSessionPage from "./pages/admin/sessions/Session";
import AdminCreateSessionPage from "./pages/admin/sessions/AddSession";

import AdminBatchPage from "./pages/admin/batches/Batch";
import AdminBatchViewPage from "./pages/admin/batches/ViewBatch";

// import AdminEnrollmentPage from "./pages/admin/enrollments/Enrollment";
// import AdminEnrollmentViewPage from "./pages/admin/enrollments/ViewEnrollment";

import AdminPaymentsPage from "./pages/admin/payments/Payments";
// import AdminViewPaymentPage from "./pages/admin/payments/ViewPayment";
// import AdminPaymentVerificationPage from "./pages/admin/enrollments/PaymentVerification";

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
            path="/student/classes"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentClassPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/class/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentViewClassPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/student/enrollment"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ViewEnrollmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrollment/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <EnrollmentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/payment/upload/:enrollmentId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <UploadPaymentSlipPage />
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
            path="/admin/chat"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminTicketReply />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/chat/ticket/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminTicketReply />
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

          <Route
            path="/admin/classes/create"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminClassesCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/classes/view/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminClassesViewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/classes/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminClassesUpdatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sessions/"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSessionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sessions/create"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCreateSessionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/batches/"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminBatchPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/batches/view/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminBatchViewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/payments/"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPaymentsPage />
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
