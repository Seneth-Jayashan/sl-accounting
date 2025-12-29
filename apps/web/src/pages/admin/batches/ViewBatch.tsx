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
  ArrowPathIcon
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
  const [activeTab, setActiveTab] = useState<"overview" | "students">("students");
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

  return (
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6 pb-24 animate-in fade-in duration-500">
        
        {/* --- Navigation & Header --- */}
        <header className="space-y-4 md:space-y-6">
          <button 
            onClick={() => navigate("/admin/batches")}
            className="flex items-center text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-cerulean hover:text-brand-prussian transition-colors"
          >
            <ArrowLeftIcon className="w-3 h-3 md:w-4 md:h-4 mr-2 stroke-[3px]" /> Back to Batches
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-brand-aliceBlue shadow-sm">
            <div className="space-y-4 w-full lg:w-auto">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-cerulean rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-cerulean/20 shrink-0">
                    <UserGroupIcon className="w-6 h-6 md:w-7 md:h-7" />
                 </div>
                 <h1 className="text-2xl md:text-4xl font-black text-brand-prussian tracking-tight leading-tight">{batch.name}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <StatusBadge isActive={batch.isActive} />
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-400 bg-brand-aliceBlue/50 px-3 py-2 md:px-4 md:py-2 rounded-xl">
                  <CalendarDaysIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-cerulean" />
                  {moment(batch.startDate).format("MMM YYYY")} — {moment(batch.endDate).format("MMM YYYY")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:w-auto">
              <StatDisplay label="Students" value={students.length} />
              <StatDisplay label="Classes" value={batch.classes?.length || 0} />
            </div>
          </div>
        </header>

        {/* --- Custom Tabs --- */}
        <div className="flex p-1.5 bg-brand-aliceBlue/40 rounded-2xl w-full md:w-fit overflow-x-auto">
          <TabTrigger 
            active={activeTab === "students"} 
            onClick={() => setActiveTab("students")} 
            label="Students" 
            count={students.length}
          />
          <TabTrigger 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
            label="Classes" 
          />
        </div>

        {/* --- Tab Content --- */}
        <main>
          <AnimatePresence mode="wait">
            {activeTab === "students" ? (
              <motion.div 
                key="students"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4 md:space-y-6"
              >
                {/* Search Bar */}
                <div className="relative w-full md:max-w-md group">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-cerulean transition-transform group-focus-within:scale-110" />
                  <input 
                    type="text" 
                    placeholder="Search name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border-2 border-brand-aliceBlue rounded-2xl md:rounded-[1.25rem] focus:border-brand-cerulean outline-none transition-all font-bold text-brand-prussian text-sm md:text-base"
                  />
                </div>

                {/* Table / List */}
                <div className="bg-white border border-brand-aliceBlue rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-sm">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-aliceBlue/20">
                          <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-brand-prussian/40 uppercase tracking-widest">Student Information</th>
                            <th className="px-8 py-5 text-[10px] font-black text-brand-prussian/40 uppercase tracking-widest">Contact Access</th>
                            <th className="px-8 py-5 text-[10px] font-black text-brand-prussian/40 uppercase tracking-widest text-right">Profile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-aliceBlue/40">
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
                                 <p className="text-brand-prussian font-bold opacity-30">No matching students found.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden divide-y divide-brand-aliceBlue/40">
                      {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                              <MobileStudentItem 
                                  key={student._id}
                                  student={student}
                                  onView={() => navigate(`/admin/students/${student._id}`)}
                              />
                          ))
                      ) : (
                          <div className="py-16 text-center">
                              <p className="text-brand-prussian font-bold opacity-30 text-sm">No matching students found.</p>
                          </div>
                      )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="classes"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
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

// --- High-Performance Sub-components ---

const StatDisplay = ({ label, value }: { label: string, value: number }) => (
  <div className="flex-1 min-w-[100px] lg:min-w-[140px] bg-brand-prussian p-4 md:p-5 rounded-2xl md:rounded-3xl text-center">
    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-brand-jasmine mb-1">{label}</div>
    <div className="text-xl md:text-2xl font-black text-white">{value}</div>
  </div>
);

const TabTrigger = ({ active, onClick, label, count }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 ${
      active ? "bg-white text-brand-cerulean shadow-sm" : "text-brand-prussian/40 hover:text-brand-prussian"
    }`}
  >
    {label} {count !== undefined && <span className="bg-brand-aliceBlue px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px]">{count}</span>}
  </button>
);

const StudentRowItem = ({ student, onView }: any) => {
  const avatarUrl = student.profilePic 
    ? (student.profilePic.startsWith('http') ? student.profilePic : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/${student.profilePic.replace(/^\/+/, "")}`)
    : `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=E8EFF7&color=05668A&bold=true`;

  return (
    <tr className="group hover:bg-brand-aliceBlue/10 transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <img src={avatarUrl} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-aliceBlue group-hover:border-brand-cerulean transition-colors" />
          <div>
            <div className="font-black text-brand-prussian">{student.firstName} {student.lastName}</div>
            <div className="text-[10px] font-bold text-brand-cerulean/60 uppercase">UID: {student._id.slice(-6)}</div>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <div className="space-y-1">
          <div className="text-sm font-bold text-brand-prussian flex items-center gap-2">
            <EnvelopeIcon className="w-4 h-4 text-brand-cerulean" /> {student.email}
          </div>
          {student.mobileNumber && (
            <div className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <PhoneIcon className="w-3.5 h-3.5" /> {student.mobileNumber}
            </div>
          )}
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <button onClick={onView} className="bg-brand-aliceBlue p-3 rounded-xl text-brand-cerulean hover:bg-brand-cerulean hover:text-white transition-all active:scale-90">
          <ArrowLeftIcon className="w-5 h-5 rotate-180 stroke-[3px]" />
        </button>
      </td>
    </tr>
  );
};

// New Mobile List Item
const MobileStudentItem = ({ student, onView }: any) => {
    const avatarUrl = student.profilePic 
      ? (student.profilePic.startsWith('http') ? student.profilePic : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/${student.profilePic.replace(/^\/+/, "")}`)
      : `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=E8EFF7&color=05668A&bold=true`;
  
    return (
        <div onClick={onView} className="p-4 flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer">
            <img src={avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 truncate">{student.firstName} {student.lastName}</h4>
                <p className="text-xs text-gray-500 truncate">{student.email}</p>
            </div>
            <ArrowLeftIcon className="w-4 h-4 text-gray-300 rotate-180" />
        </div>
    );
}

const ClassCard = ({ cls, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-[2rem] border-2 border-brand-aliceBlue hover:border-brand-cerulean transition-all cursor-pointer group shadow-sm"
  >
    <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-aliceBlue rounded-2xl flex items-center justify-center text-brand-cerulean mb-4 md:mb-5 group-hover:scale-110 transition-transform">
      <AcademicCapIcon className="w-6 h-6 md:w-7 md:h-7" />
    </div>
    <h4 className="text-base md:text-lg font-black text-brand-prussian mb-1 md:mb-2">{cls.className || cls.name}</h4>
    <p className="text-xs md:text-sm font-medium text-gray-400 leading-relaxed">{cls.subject || "No specific subject defined"}</p>
  </div>
);

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <div className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
    isActive ? "bg-green-100 text-green-700" : "bg-brand-aliceBlue text-brand-prussian/40"
  }`}>
    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
    {isActive ? "Active" : "Archived"}
  </div>
);

const LoadingState = () => (
    <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
      <ArrowPathIcon className="w-10 h-10 md:w-12 md:h-12 text-brand-cerulean animate-spin" />
      <p className="text-brand-prussian text-xs md:text-sm font-black uppercase tracking-tighter animate-pulse">Synchronizing Data...</p>
    </div>
);

const EmptyClasses = () => (
  <div className="col-span-full py-16 md:py-20 text-center bg-brand-aliceBlue/20 rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-brand-aliceBlue">
    <AcademicCapIcon className="w-10 h-10 md:w-12 md:h-12 text-brand-cerulean/30 mx-auto mb-4" />
    <p className="text-brand-prussian font-bold text-sm md:text-base">No academic classes linked to this batch yet.</p>
  </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
    <div className="text-center py-32 space-y-6">
      <div className="text-5xl md:text-6xl text-brand-prussian opacity-10 font-black">404</div>
      <h2 className="text-xl md:text-2xl font-black text-brand-prussian">Batch Not Found</h2>
      <button onClick={onBack} className="bg-brand-prussian text-white px-6 py-2.5 md:px-8 md:py-3 rounded-2xl font-bold hover:bg-brand-cerulean transition-all text-sm md:text-base">
        Go Back
      </button>
    </div>
);