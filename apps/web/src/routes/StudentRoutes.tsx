import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PageLoader } from "../components/PageLoader";
import StudentLayout from "../layouts/StudentLayout";

// --- Lazy Load Student Pages ---
const Dashboard = lazy(() => import("../pages/student/Dashboard"));
const Tickets = lazy(() => import("../pages/student/Ticket"));
const Classes = lazy(() => import("../pages/student/class/Classes"));
const ViewClass = lazy(() => import("../pages/student/class/ViewClass"));
const ViewRecording = lazy(() => import("../pages/student/class/ViewRecording"));
const Enrollment = lazy(() => import("../pages/student/enrollment/Enrollment"));
const ViewEnrollment = lazy(() => import("../pages/student/enrollment/ViewEnrollment"));
const UploadSlip = lazy(() => import("../pages/student/payments/UploadPaymentSlip"));
const PaymentHistory = lazy(() => import("../pages/student/payments/PaymentHistory"));
const KnowledgeBase = lazy(() => import("../pages/student/KnowledgeBasestudent"));
const Profile = lazy(() => import("../pages/student/profile/Profile"));

export const StudentRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<StudentLayout />}>
        
          <Route path="/" element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          
          {/* Class Interaction */}
          <Route path="classes" element={<Classes />} />
          <Route path="class/:id" element={<ViewClass />} />
          <Route path="class/recording/:sessionId" element={<ViewRecording />} />

          {/* Enrollment & Payments */}
          <Route path="enrollment" element={<ViewEnrollment />} />
          <Route path="enrollment/:id" element={<Enrollment />} />
          <Route path="payment/upload/:enrollmentId" element={<UploadSlip />} />
          <Route path="payments" element={<PaymentHistory />} />

          {/* Default Student Route */}
          <Route path="*" element={<Navigate to="/student/" replace />} />

          {/* Knowledge Base */}
          <Route path="knowledge-base" element={<KnowledgeBase />} />

          {/* Profile */}
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Suspense>
  );
};