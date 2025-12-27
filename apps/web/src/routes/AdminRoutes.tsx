import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PageLoader } from "../components/PageLoader";

// --- Lazy Load Admin Pages ---
// Security: These files are not fetched until an admin logs in.
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const Students = lazy(() => import("../pages/admin/students/Students"));
const ViewStudent = lazy(() => import("../pages/admin/students/ViewStudent"));
const UpdateStudent = lazy(() => import("../pages/admin/students/UpdateStudent"));
const Classes = lazy(() => import("../pages/admin/classes/Class"));
const CreateClass = lazy(() => import("../pages/admin/classes/CreateClass"));
const ViewClass = lazy(() => import("../pages/admin/classes/ViewClass"));
const UpdateClass = lazy(() => import("../pages/admin/classes/UpdateClass"));
const Sessions = lazy(() => import("../pages/admin/sessions/Session"));
const AddSession = lazy(() => import("../pages/admin/sessions/AddSession"));
const Batches = lazy(() => import("../pages/admin/batches/Batch"));
const ViewBatch = lazy(() => import("../pages/admin/batches/ViewBatch"));
const Payments = lazy(() => import("../pages/admin/payments/Payments"));
const CreatePayment = lazy(() => import("../pages/admin/payments/CreatePaymentPage"));
const SupportReply = lazy(() => import("../pages/admin/support/SupportReply"));
const TicketChat = lazy(() => import("../pages/admin/support/TicketChat"));
const KnowledgeBase = lazy(() => import("../pages/admin/KnowledgeBase/KnowledgeBase"));
const KnowledgeBaseList = lazy(() => import("../pages/admin/KnowledgeBase/KnowledgeList"));

export const AdminRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Student Management */}
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<ViewStudent />} />
        <Route path="students/edit/:id" element={<UpdateStudent />} />

        {/* Classes */}
        <Route path="classes" element={<Classes />} />
        <Route path="classes/create" element={<CreateClass />} />
        <Route path="classes/view/:id" element={<ViewClass />} />
        <Route path="classes/edit/:id" element={<UpdateClass />} />

        {/* Sessions */}
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/create" element={<AddSession />} />

        {/* Batches */}
        <Route path="batches" element={<Batches />} />
        <Route path="batches/view/:id" element={<ViewBatch />} />

        {/* Payments & Support */}
        <Route path="payments" element={<Payments />} />
        <Route path="payments/create" element={<CreatePayment />} />
        <Route path="support" element={<SupportReply />} />
        <Route path="chat" element={<TicketChat />} />
        <Route path="chat/ticket/:id" element={<TicketChat />} />

        {/* Default Admin Route */}
        <Route path="*" element={<Navigate to="/admin/" replace />} />

        {/* Knowledge Base */}
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="knowledge-list" element={<KnowledgeBaseList />} />
      </Routes>
    </Suspense>
  );
};