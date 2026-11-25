import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import BatchService, { type BatchData } from "../../../services/BatchService";

import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// --- Student Type ---
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  profilePic?: string;
  createdAt: string;
}

// --- Skeleton Loader ---
function BatchDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-16">
      <div className="h-9 w-36 bg-slate-200 rounded-xl" />
      <div className="h-44 bg-white rounded-2xl border border-slate-100 p-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6" />
        ))}
      </div>
      <div className="h-80 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-64 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function ViewBatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<BatchData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "overview">("students");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [batchRes, studentRes] = await Promise.allSettled([
        BatchService.getBatchById(id),
        BatchService.getBatchStudents(id),
      ]);

      if (batchRes.status === "fulfilled" && batchRes.value.success) {
        setBatch(batchRes.value.batch || null);
      }

      if (studentRes.status === "fulfilled") {
        setStudents(studentRes.value.students || []);
      }
    } catch (error) {
      console.error("Critical fetch error", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return students;
    return students.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        (s.mobileNumber || "").toLowerCase().includes(term)
    );
  }, [searchTerm, students]);

  if (loading && !batch) return <BatchDetailSkeleton />;
  if (!batch) return <NotFoundState onBack={() => navigate("/admin/batches")} />;

  const classesList = batch.classes || [];
  const durationMonths = Math.max(
    1,
    moment(batch.endDate).diff(moment(batch.startDate), "months")
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* TOP ACTION BAR */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/batches")}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Batches
        </button>

        <button
          onClick={loadData}
          disabled={loading}
          title="Refresh batch data"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* HERO BATCH HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-cerulean/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 w-48 h-48 rounded-full bg-brand-jasmine/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge isActive={batch.isActive} />
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-brand-jasmine" />
                {moment(batch.startDate).format("DD MMM YYYY")} —{" "}
                {moment(batch.endDate).format("DD MMM YYYY")}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {batch.name}
            </h1>

            {batch.description && (
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {batch.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enrolled Students
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {students.length}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <UserGroupIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Linked Classes
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {classesList.length}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Duration
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {durationMonths}
                <span className="text-sm font-medium text-slate-400 ml-1.5">
                  {durationMonths === 1 ? "month" : "months"}
                </span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <ClockIcon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENTED TABS */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/70 shadow-sm w-full sm:w-fit">
        <TabTrigger
          active={activeTab === "students"}
          onClick={() => setActiveTab("students")}
          label="Students"
          count={students.length}
        />
        <TabTrigger
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          label="Linked Classes"
          count={classesList.length}
        />
      </div>

      {/* TAB CONTENT */}
      <main>
        <AnimatePresence mode="wait">
          {activeTab === "students" ? (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden"
            >
              {/* Search Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search student by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-medium tabular-nums">
                  Showing <strong className="text-brand-prussian">{filteredStudents.length}</strong>{" "}
                  of <strong className="text-brand-prussian">{students.length}</strong> students
                </span>
              </div>

              {/* Desktop Table */}
              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                    <UserGroupIcon className="w-7 h-7 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-brand-prussian">
                    No students found
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {students.length === 0
                      ? "No students are assigned to this batch yet."
                      : "Try adjusting your search query."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5">Student</th>
                          <th className="px-6 py-3.5">Contact</th>
                          <th className="px-6 py-3.5">Joined</th>
                          <th className="px-6 py-3.5 text-right">Profile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((student) => (
                          <StudentRowItem
                            key={student._id}
                            student={student}
                            onView={() => navigate(`/admin/students/${student._id}`)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <MobileStudentItem
                        key={student._id}
                        student={student}
                        onView={() => navigate(`/admin/students/${student._id}`)}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {classesList.length > 0 ? (
                classesList.map((cls: any) => (
                  <ClassCard
                    key={cls._id}
                    cls={cls}
                    onClick={() => navigate(`/admin/classes/view/${cls._id}`)}
                  />
                ))
              ) : (
                <EmptyClasses />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-components ---

const TabTrigger = ({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${active
        ? "bg-brand-prussian text-white shadow-sm"
        : "text-slate-500 hover:text-brand-prussian hover:bg-slate-50"
      }`}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500"
          }`}
      >
        {count}
      </span>
    )}
  </button>
);

const getAvatarUrl = (student: Student) =>
  student.profilePic
    ? student.profilePic.startsWith("http")
      ? student.profilePic
      : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/${student.profilePic.replace(/^\/+/, "")}`
    : `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=E8EFF7&color=05668A&bold=true`;

const StudentRowItem = ({
  student,
  onView,
}: {
  student: Student;
  onView: () => void;
}) => (
  <tr className="hover:bg-slate-50/80 transition-colors group">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <img
          src={getAvatarUrl(student)}
          alt={`${student.firstName} ${student.lastName}`}
          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
        />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-brand-prussian truncate">
            {student.firstName} {student.lastName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            #{student._id.slice(-6).toUpperCase()}
          </div>
        </div>
      </div>
    </td>

    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="text-sm text-slate-700 flex items-center gap-2">
          <EnvelopeIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate max-w-xs">{student.email}</span>
        </div>
        {student.mobileNumber && (
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{student.mobileNumber}</span>
          </div>
        )}
      </div>
    </td>

    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 tabular-nums">
      {student.createdAt ? moment(student.createdAt).format("DD MMM YYYY") : "—"}
    </td>

    <td className="px-6 py-4 text-right whitespace-nowrap">
      <button
        onClick={onView}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-aliceBlue text-xs font-semibold text-brand-prussian hover:text-brand-cerulean border border-slate-200/70 transition-colors"
      >
        <span>View</span>
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </button>
    </td>
  </tr>
);

const MobileStudentItem = ({
  student,
  onView,
}: {
  student: Student;
  onView: () => void;
}) => (
  <div
    onClick={onView}
    className="p-4 flex items-center gap-3.5 active:bg-slate-50 transition-colors cursor-pointer"
  >
    <img
      src={getAvatarUrl(student)}
      alt={`${student.firstName} ${student.lastName}`}
      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
    />
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-sm text-brand-prussian truncate">
        {student.firstName} {student.lastName}
      </h4>
      <p className="text-xs text-slate-400 truncate">{student.email}</p>
    </div>
    <ChevronRightIcon className="w-4 h-4 text-slate-300 shrink-0" />
  </div>
);

const ClassCard = ({ cls, onClick }: { cls: any; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group text-left bg-white p-6 rounded-2xl border border-slate-200/70 hover:border-brand-cerulean/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4"
  >
    <div className="w-full flex items-start justify-between gap-3">
      <div className="w-11 h-11 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center group-hover:bg-brand-cerulean group-hover:text-white transition-colors shrink-0">
        <AcademicCapIcon className="w-6 h-6" />
      </div>
      <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all mt-1" />
    </div>

    <div>
      <h4 className="text-base font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors leading-snug">
        {cls.className || cls.name}
      </h4>
      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
        {cls.subject || "No specific subject defined"}
      </p>
    </div>
  </button>
);

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isActive
        ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
        : "bg-white/10 text-slate-300 border-white/15"
      }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
        }`}
    />
    {isActive ? "Active Batch" : "Archived"}
  </span>
);

const EmptyClasses = () => (
  <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
      <AcademicCapIcon className="w-7 h-7 text-slate-300" />
    </div>
    <h3 className="text-sm font-semibold text-brand-prussian">
      No linked classes yet
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Classes assigned to this batch will appear here.
    </p>
  </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
      <ExclamationTriangleIcon className="w-7 h-7" />
    </div>
    <h2 className="text-lg font-bold text-brand-prussian mb-1">
      Batch Not Found
    </h2>
    <p className="text-sm text-slate-500 mb-6 max-w-sm">
      The batch you are looking for may have been removed or does not exist.
    </p>
    <button
      onClick={onBack}
      className="px-5 py-2.5 bg-brand-prussian text-white text-sm font-semibold rounded-xl hover:bg-brand-cerulean transition-colors"
    >
      Back to Batches
    </button>
  </div>
);