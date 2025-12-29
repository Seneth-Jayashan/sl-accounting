import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hash, Calendar, BookOpen } from "lucide-react";

import { useAuth } from "../../../../contexts/AuthContext";
import BatchService, { type BatchData } from "../../../../services/BatchService";
import EnrollmentService, { type EnrollmentResponse } from "../../../../services/EnrollmentService";

export default function AcademicTab() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        // 1. Fetch Enrollments
        const enrollRes = await EnrollmentService.getMyEnrollments();
        setEnrollments(Array.isArray(enrollRes) ? enrollRes : []);

        // 2. Fetch Batch Details
        const batchId = typeof user?.batch === 'string' ? user.batch : (user?.batch as any)?._id;
        if (batchId) {
          const batchRes = await BatchService.getBatchById(batchId);
          if (batchRes.batch) {
            setBatchData(batchRes.batch);
          }
        }
      } catch (error) {
        console.error("Failed to fetch academic data", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAcademicData();
  }, [user]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading academic details...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Batch Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Hash className="text-brand-cerulean" /> Batch Information
        </h2>
        {batchData ? (
            <div className="bg-brand-aliceBlue/30 rounded-xl p-4 border border-brand-aliceBlue">
                <h3 className="font-bold text-brand-prussian text-lg">{batchData.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{batchData.description || "No description available."}</p>
                <div className="flex gap-4 mt-3 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12}/> Starts: {new Date(batchData.startDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> Ends: {new Date(batchData.endDate).toLocaleDateString()}</span>
                </div>
            </div>
        ) : (
            <div className="text-gray-400 text-sm italic">No batch information assigned.</div>
        )}
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="text-brand-cerulean" /> Enrolled Classes
        </h2>
        
        {enrollments.length > 0 ? (
            <div className="space-y-3">
                {enrollments.map((enroll) => {
                    const classData = enroll.class as any; 
                    return (
                        <div key={enroll._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-brand-cerulean/30 hover:bg-gray-50 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center font-bold">
                                    {classData.name ? classData.name.charAt(0) : "C"}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">{classData.name || "Class Name Unavailable"}</h4>
                                    <p className="text-xs text-gray-500 capitalize">{classData.subject || "General Subject"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${enroll.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {enroll.isActive ? 'Active' : 'Expired'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                <p>You haven't enrolled in any classes yet.</p>
            </div>
        )}
      </div>
    </motion.div>
  );
}