import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import moment from "moment";
import { 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Calendar,
  Filter,
  CreditCard,
} from "lucide-react";

import EnrollmentService, { type EnrollmentResponse, type EnrolledStudent } from "../../../services/EnrollmentService";

interface Props {
  classId: string;
}

export default function StudentEnrollmentTab({ classId }: Props) {
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");

  // --- FETCH DATA ---
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EnrollmentService.getAllEnrollments({ classId });
      
      // Robust Data Handling based on your Service Interface
      let data: EnrollmentResponse[] = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res.enrollments && Array.isArray(res.enrollments)) {
        data = res.enrollments;
      }
      
      setEnrollments(data);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // --- ACTIONS ---

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!window.confirm("Are you sure? This will remove the student's access to this class immediately.")) return;

    try {
      await EnrollmentService.deleteEnrollment(enrollmentId);
      setEnrollments(prev => prev.filter(e => e._id !== enrollmentId));
    } catch (err) {
      alert("Failed to remove student.");
    }
  };

  const handleTogglePayment = async (enrollment: EnrollmentResponse) => {
    const newStatus = enrollment.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    const isActive = newStatus === 'paid'; // Usually paid means active access

    try {
      await EnrollmentService.updateEnrollment(enrollment._id, { 
        paymentStatus: newStatus,
        isActive: isActive 
      });

      // Optimistic Update
      setEnrollments(prev => prev.map(e => 
        e._id === enrollment._id 
          ? { ...e, paymentStatus: newStatus, isActive: isActive } 
          : e
      ));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  // --- FILTER LOGIC ---
  const filteredEnrollments = enrollments.filter(item => {
    // Type Guard: Ensure student is populated object before accessing fields
    const student = typeof item.student === 'object' ? item.student as EnrolledStudent : null;
    if (!student) return false;

    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Class Roster...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* 1. Toolbar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-2xl border border-brand-aliceBlue shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search student by name or email..." 
            className="w-full pl-10 pr-4 py-2.5 bg-brand-aliceBlue/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Status */}
        <div className="relative min-w-[150px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select 
            className="w-full pl-10 pr-4 py-2.5 bg-brand-aliceBlue/30 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-cerulean/20 outline-none appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid / Pending</option>
          </select>
        </div>
      </div>

      {/* 2. Students List */}
      <div className="bg-white border border-brand-aliceBlue rounded-[1.5rem] overflow-hidden shadow-sm">
        {filteredEnrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-aliceBlue/40 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-brand-aliceBlue">
                  <th className="p-5 pl-6">Student Profile</th>
                  <th className="p-5">Enrollment Date</th>
                  <th className="p-5">Payment Status</th>
                  <th className="p-5 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-aliceBlue">
                {filteredEnrollments.map((enrollment) => {
                   const student = enrollment.student as EnrolledStudent;
                   if(!student) return null; // Safety check

                   return (
                    <tr key={enrollment._id} className="group hover:bg-brand-aliceBlue/10 transition-colors">
                      {/* Profile Column */}
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                            {student.profilePic ? (
                              <img src={student.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              student.firstName?.charAt(0) || "U"
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-prussian">{student.firstName} {student.lastName}</p>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Mail size={10} />
                              <span className="text-xs">{student.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                           <Calendar size={14} className="text-brand-cerulean/60" />
                           {moment(enrollment.enrollmentDate).format("MMM DD, YYYY")}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-5">
                        {enrollment.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wide border border-green-100">
                            <CheckCircle size={12} /> Paid Access
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wide border border-red-100">
                            <XCircle size={12} /> {enrollment.paymentStatus}
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="p-5 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                              onClick={() => handleTogglePayment(enrollment)}
                              className={`p-2 rounded-lg transition-all ${
                                enrollment.paymentStatus === 'paid' 
                                  ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                                  : 'text-brand-cerulean bg-brand-aliceBlue hover:bg-brand-cerulean hover:text-white'
                              }`}
                              title={enrollment.paymentStatus === 'paid' ? "Mark as Unpaid" : "Mark as Paid"}
                           >
                             <CreditCard size={16} />
                           </button>

                           <button 
                              onClick={() => handleRemoveStudent(enrollment._id)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Remove Student"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-16 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-gray-300" size={28} />
             </div>
             <p className="text-sm font-semibold text-brand-prussian">No students found.</p>
             <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
        <span>Total Students: {filteredEnrollments.length}</span>
        <span className="text-brand-cerulean">Active: {filteredEnrollments.filter(e => e.isActive).length}</span>
      </div>
    </motion.div>
  );
}