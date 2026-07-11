import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import BatchService, { type BatchData } from "../../../services/BatchService";

import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

// --- Updated Student Type ---
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  profilePic?: string;
  createdAt: string;
}

export default function ViewBatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<BatchData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "classes">("students");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [batchRes, studentRes] = await Promise.allSettled([
        BatchService.getBatchById(id),
        BatchService.getBatchStudents(id)
      ]);

      if (batchRes.status === 'fulfilled' && batchRes.value.success) {
        setBatch(batchRes.value.batch || null);
      }

      if (studentRes.status === 'fulfilled') {
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
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  }, [searchTerm, students]);

  if (loading) return <LoadingState />;
  if (!batch) return <NotFoundState onBack={() => navigate("/admin/batches")} />;

  // Helper for 2-digit format
  const formatCount = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full space-y-6 pb-20 overflow-x-hidden">

      {/* --- Back Button --- */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={() => navigate("/admin/batches")}
          className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shrink-0"
        >
          <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* --- Header Card --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5 md:gap-8">
          {/* Sigma Icon replacement to match design */}
          <div className="text-[50px] md:text-[60px] font-serif font-black text-[#0d4b5b] leading-none shrink-0 select-none">
            Σ
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">
              {batch.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2.5 md:mt-3">
              <StatusBadge isActive={batch.isActive} />
              <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-bold text-gray-500 tracking-wide">
                {moment(batch.startDate).format("MMM YYYY")} - {moment(batch.endDate).format("MMM YYYY")}
              </div>
            </div>
          </div>
        </div>

        {/* Stat Boxes */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="bg-[#0d4b5b] rounded-2xl p-4 min-w-[100px] flex-1 lg:flex-none text-center shadow-sm">
            <p className="text-[10px] text-white/80 font-bold mb-1 tracking-wider">Students</p>
            <p className="text-3xl font-black text-white leading-none">{formatCount(students.length)}</p>
          </div>
          <div className="bg-[#0d4b5b] rounded-2xl p-4 min-w-[100px] flex-1 lg:flex-none text-center shadow-sm">
            <p className="text-[10px] text-white/80 font-bold mb-1 tracking-wider">Classes</p>
            <p className="text-3xl font-black text-white leading-none">{formatCount(batch.classes?.length || 0)}</p>
          </div>
        </div>
      </div>

      {/* --- Custom Tabs --- */}
      <div className="flex items-center gap-2 border-b border-transparent">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === "students" ? "bg-[#0d4b5b] text-white shadow-sm" : "bg-transparent text-[#0d4b5b] hover:bg-gray-50"
            }`}
        >
          Students ({formatCount(students.length)})
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === "classes" ? "bg-[#0d4b5b] text-white shadow-sm" : "bg-transparent text-[#0d4b5b] hover:bg-gray-50"
            }`}
        >
          Classes ({formatCount(batch.classes?.length || 0)})
        </button>
      </div>

      {/* --- Tab Content --- */}
      <main>
        <AnimatePresence mode="wait">
          {activeTab === "students" ? (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all text-sm font-medium text-gray-700 placeholder:text-gray-300 shadow-sm"
                />
              </div>

              {/* Table Area */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {/* Desktop Table */}
                <div className="hidden md:block w-full overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-[40%]">Student Information</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-[40%]">Contact Access</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-[20%]">Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <StudentRowItem
                            key={student._id}
                            student={student}
                            onView={() => navigate(`/admin/students/${student._id}`)}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-24 text-center">
                            <p className="text-gray-400 font-medium text-sm">No matching students found.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden divide-y divide-gray-50">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <MobileStudentItem
                        key={student._id}
                        student={student}
                        onView={() => navigate(`/admin/students/${student._id}`)}
                      />
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-gray-400 font-medium text-sm">No matching students found.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {batch.classes?.map((cls: any) => (
                <ClassCard key={cls._id} cls={cls} onClick={() => navigate(`/admin/classes/view/${cls._id}`)} />
              )) || <EmptyClasses />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-components ---

const StudentRowItem = ({ student, onView }: any) => {
  const avatarUrl = student.profilePic
    ? (student.profilePic.startsWith('http') ? student.profilePic : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/${student.profilePic.replace(/^\/+/, "")}`)
    : `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=eef2f6&color=0d4b5b&bold=true`;

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col items-center text-center gap-2">
          <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
          <div>
            <div className="font-bold text-[13px] text-gray-900">{student.firstName} {student.lastName}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">ID: {student._id.slice(-6)}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col items-center justify-center space-y-1.5">
          <div className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5">
            <EnvelopeIcon className="w-3.5 h-3.5 text-[#0d4b5b]" /> {student.email}
          </div>
          {student.mobileNumber && (
            <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
              <PhoneIcon className="w-3 h-3" /> {student.mobileNumber}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 align-middle text-center">
        <button
          onClick={onView}
          className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] inline-flex items-center justify-center hover:bg-[#0d4b5b] hover:text-white transition-all active:scale-95"
        >
          <ArrowRightIcon className="w-4 h-4 stroke-[3px]" />
        </button>
      </td>
    </tr>
  );
};

const MobileStudentItem = ({ student, onView }: any) => {
  const avatarUrl = student.profilePic
    ? (student.profilePic.startsWith('http') ? student.profilePic : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/${student.profilePic.replace(/^\/+/, "")}`)
    : `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=eef2f6&color=0d4b5b&bold=true`;

  return (
    <div onClick={onView} className="p-4 flex items-center justify-between gap-4 active:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0" />
        <div className="min-w-0">
          <h4 className="font-bold text-[13px] text-gray-900 truncate">{student.firstName} {student.lastName}</h4>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{student.email}</p>
        </div>
      </div>
      <ArrowRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
    </div>
  );
}

const ClassCard = ({ cls, onClick }: any) => (
  <div
    onClick={onClick}
    className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#0d4b5b] transition-all cursor-pointer shadow-sm group flex items-start gap-4"
  >
    <div className="w-12 h-12 bg-[#eef2f6] rounded-xl flex items-center justify-center text-[#0d4b5b] shrink-0 group-hover:scale-105 transition-transform">
      <AcademicCapIcon className="w-6 h-6 stroke-[1.5]" />
    </div>
    <div>
      <h4 className="text-[14px] font-bold text-gray-900 leading-tight mb-1">{cls.className || cls.name}</h4>
      <p className="text-[11px] font-medium text-gray-500 line-clamp-2">{cls.subject || "No specific subject defined"}</p>
    </div>
  </div>
);

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <div className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 ${isActive ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-gray-50 border-gray-200 text-gray-500"
    }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
    {isActive ? "Active" : "Archived"}
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
    <ArrowPathIcon className="w-8 h-8 text-[#0d4b5b]/50 animate-spin" />
    <p className="text-[#0d4b5b] text-xs font-bold uppercase tracking-widest animate-pulse">Loading Details...</p>
  </div>
);

const EmptyClasses = () => (
  <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl">
    <AcademicCapIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-900 font-bold text-sm">No classes linked</p>
    <p className="text-xs text-gray-500 mt-1">This batch doesn't have any active classes yet.</p>
  </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="text-center py-32 space-y-4">
    <div className="text-6xl text-gray-200 font-black">404</div>
    <h2 className="text-xl font-black text-gray-900">Batch Not Found</h2>
    <button onClick={onBack} className="bg-[#0d4b5b] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#093946] transition-colors text-sm shadow-sm">
      Go Back
    </button>
  </div>
);