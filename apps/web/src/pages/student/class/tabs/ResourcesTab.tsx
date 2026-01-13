import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Added for navigation
import { motion } from "framer-motion";
import { 
  FolderOpen, 
  FileText, 
  Download, 
  RotateCw, 
  Presentation, 
  Image as ImageIcon, 
  File as FileIcon, 
  FileEdit,
  Lock,           // Added
  AlertCircle,     // Added
  FileCode
} from "lucide-react";
import MaterialService, { type MaterialData } from "../../../../services/MaterialService";
import EnrollmentService, { type EnrollmentResponse } from "../../../../services/EnrollmentService"; // Added

// --- Helpers ---
const getMonthString = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function ResourcesTab({ classId }: { classId: string }) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data (Materials + Enrollment)
  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [matRes, enrollRes] = await Promise.all([
             MaterialService.getStudentMaterials(classId),
             EnrollmentService.getMyEnrollments()
        ]);
        
        if (isMounted) {
            // A. Handle Materials Data
            const data = (matRes as any).data || matRes;
            if (Array.isArray(data)) {
                setMaterials(data);
            } else if (data && typeof data === 'object') {
                setMaterials(Array.isArray(data.data) ? data.data : [data]);
            } else {
                setMaterials([]);
            }

            // B. Handle Enrollment Data (Find specific enrollment for this class)
            const match = enrollRes.find((e: any) => 
                (typeof e.class === 'string' ? e.class : e.class._id) === classId
            );
            setEnrollment(match || null);
        }
      } catch (err) {
        console.error("Failed to load resources data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [classId]);

  // 2. Icon Helper
  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
      case "pdf": return <FileText size={20} className="text-red-500" />;
      case "pptx": case "ppt": return <Presentation size={20} className="text-orange-500" />;
      case "jpg": case "jpeg": case "png": case "webp": return <ImageIcon size={20} className="text-blue-500" />;
      case "docx": case "doc": return <FileEdit size={20} className="text-blue-600" />;
      default: return <FileIcon size={20} className="text-gray-400" />;
    }
  };

  // 3. Access Logic Helper
  const getAccessStatus = (file: MaterialData) => {
      if (!enrollment) return { locked: true, reason: "Not Enrolled" };

      const fileMonth = getMonthString(file.createdAt);
      const paidMonths = enrollment.paidMonths || [];

      // Check if the month the file was created in is paid for
      if (!paidMonths.includes(fileMonth)) {
          const monthName = new Date(file.createdAt).toLocaleDateString('en-US', { month: 'long' });
          return { locked: true, reason: `Pay for ${monthName}` };
      }

      return { locked: false, reason: "" };
  };

  // 4. Sorted Materials (Newest First)
  const sortedMaterials = useMemo(() => {
      return [...materials].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [materials]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <RotateCw className="w-8 h-8 animate-spin text-brand-cerulean opacity-50" />
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Syncing Library...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex items-center gap-3 sm:mb-8 mb-6">
        <div className="p-2.5 sm:p-3 bg-brand-cerulean/10 rounded-2xl text-brand-cerulean">
          <FolderOpen size={20} className="opacity-90" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">
          Study Materials
        </h2>
      </div>
      
      {sortedMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedMaterials.map((file) => {
            const { locked, reason } = getAccessStatus(file);

            return (
                <div 
                  key={file._id} 
                  className={`relative p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 flex items-center justify-between group ${
                      locked 
                      ? "bg-gray-50 border-gray-200" 
                      : "bg-white border-brand-aliceBlue hover:border-brand-cerulean/20 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    {/* Icon Container */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                        locked 
                        ? "bg-gray-200 grayscale opacity-50" 
                        : "bg-brand-aliceBlue/50 group-hover:bg-brand-cerulean/5"
                    }`}>
                      {locked ? <Lock size={20} className="text-gray-400"/> : getFileIcon(file.fileType)}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate w-full tracking-tight transition-colors ${
                          locked ? "text-gray-400" : "text-brand-prussian group-hover:text-brand-cerulean"
                      }`} title={file.title}>
                        {file.title}
                      </h4>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                            {locked ? (
                                <span className="text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {reason}</span>
                            ) : (
                                <span>{file.fileSize || "Unknown Size"}</span>
                            )}
                          </p>
                          {file.description && !locked && (
                              <p className="text-[10px] text-gray-400 truncate w-24 sm:w-32 opacity-70">{file.description}</p>
                          )}
                      </div>
                    </div>
                  </div>
                  
                  {locked ? (
                      <button 
                        onClick={() => navigate(`/student/payment/create/${classId}`)}
                        className="p-2.5 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-wider w-20 flex justify-center"
                      >
                          Unlock
                      </button>
                  ) : (
                      <a 
                        href={`${import.meta.env.VITE_API_BASE_URL}${file.fileUrl}`} 
                        target="_blank" 
                        rel="noreferrer noopener"
                        className="p-2.5 bg-brand-aliceBlue text-gray-500 rounded-xl hover:bg-brand-prussian hover:text-white transition-all transform active:scale-90"
                        title="Download File"
                      >
                        <Download size={18} />
                      </a>
                  )}
                </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-[2rem] p-10 sm:p-20 text-center border-2 border-dashed border-brand-aliceBlue flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-aliceBlue/30 rounded-full flex items-center justify-center mb-6">
            <FileCode className="text-brand-cerulean/40" size={24} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-brand-prussian tracking-tight">
            No Documents Yet
          </h3>
          <p className="text-gray-400 mt-2 max-w-xs mx-auto text-sm font-normal leading-relaxed">
            Your instructor hasn't uploaded any lecture notes or supporting materials for this module yet.
          </p>
        </div>
      )}
    </motion.div>
  );
}