import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PageLoader } from "../components/PageLoader";
import AdminLayout from "../layouts/AdminLayout"; // The persistent wrapper

// --- Lazy Load Admin Pages ---
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const Students = lazy(() => import("../pages/admin/students/Students"));
const AddStudent = lazy(() => import("../pages/admin/students/AddStudent"));
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
const Announcements = lazy(() => import("../pages/admin/announcements/Announcement"));
const Materials = lazy(() => import("../pages/admin/materials/Materials"));
const Community = lazy(() => import("../pages/admin/communities/Community"));
const Reports = lazy(() => import("../pages/admin/reports/PaymentReport"));
const TuteDelivery = lazy(() => import("../pages/admin/tutes/Tutes"));
const Quizzes = lazy(() => import("../pages/admin/quizzes/Quizzes"));
const CreateQuiz = lazy(() => import("../pages/admin/quizzes/CreateQuiz"));
const ViewQuiz = lazy(() => import("../pages/admin/quizzes/ViewQuiz"));
const UpdateQuiz = lazy(() => import("../pages/admin/quizzes/UpdateQuiz"));
import QuizAnalytics from "../pages/admin/quizzes/QuizAnalytics";
import AdminSubmissionReview from "../pages/admin/quizzes/AdminSubmissionReview";
import LessonPacks from "../pages/admin/lessonPacks/LessonPacks";

export const AdminRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        <Route element={<AdminLayout />}>
          
          <Route path="/" element={<Dashboard />} />

          {/* Reports */}
          <Route path="reports" element={<Reports />} />
          
          {/* Student Management */}
          <Route path="students" element={<Students />} />
          <Route path="students/add" element={<AddStudent />} />
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

          {/* Quizzes */}
          <Route path="quizzes" element={<Quizzes />} />
          <Route path="quizzes/create" element={<CreateQuiz />} />
          <Route path="quizzes/view/:id" element={<ViewQuiz />} />
          <Route path="quizzes/edit/:id" element={<UpdateQuiz />} />
          <Route path="quizzes/analytics/:id" element={<QuizAnalytics />} />
          <Route path="quizzes/submission/:id" element={<AdminSubmissionReview />} />

          {/* Batches */}
          <Route path="batches" element={<Batches />} />
          <Route path="batches/view/:id" element={<ViewBatch />} />

          {/* Lesson Packs */}
          <Route path="lesson-packs" element={<LessonPacks />} />

          {/* Announcements */}
          <Route path="announcements" element={<Announcements />} />

          {/* Class Materials */}
          <Route path="materials" element={<Materials />} />

          {/* Payments & Support */}
          <Route path="payments" element={<Payments />} />
          <Route path="payments/create" element={<CreatePayment />} />
          <Route path="support" element={<SupportReply />} />
          <Route path="chat" element={<TicketChat />} />
          <Route path="chat/ticket/:id" element={<TicketChat />} />

          {/* Knowledge Base */}
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="knowledge-list" element={<KnowledgeBaseList />} />

          {/* Community */}
          <Route path="community" element={<Community />} />

          {/* Tute Delivery */}
          <Route path="tute-delivery" element={<TuteDelivery />} />

          {/* Default Admin Route - Redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/admin/" replace />} />
          
        </Route>
      </Routes>
    </Suspense>
  );
};