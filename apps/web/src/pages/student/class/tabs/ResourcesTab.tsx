import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FolderOpen, 
  FileText, 
  Download, 
  FileCode, 
  RotateCw, 
  Presentation, 
  Image as ImageIcon, 
  File as FileIcon, 
  FileEdit 
} from "lucide-react";
import MaterialService, { type MaterialData } from "../../../../services/MaterialService";

export default function ResourcesTab({ classId }: { classId: string }) {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. If no classId is passed, stop loading immediately
    if (!classId) {
      setLoading(false);
      return;
    }

    const fetchMaterials = async () => {
      setLoading(true); // Ensure loading starts
      try {
        const res = await MaterialService.getStudentMaterials(classId);
        
        // 2. Robust data extraction
        const data = (res as any).data || res;
        
        if (Array.isArray(data)) {
          setMaterials(data);
        } else if (data && typeof data === 'object') {
          // Handle single object response or wrapped data
          setMaterials(Array.isArray(data.data) ? data.data : [data]);
        } else {
          setMaterials([]);
        }
      } catch (err) {
        console.error("Failed to load materials", err);
      } finally {
        setLoading(false); // 3. Always turn off loading
      }
    };

    fetchMaterials();
  }, [classId]);

  // Helper to choose icon based on file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText size={20} className="text-red-500" />;
      case "pptx": return <Presentation size={20} className="text-orange-500" />;
      case "image": return <ImageIcon size={20} className="text-blue-500" />;
      case "docx": return <FileEdit size={20} className="text-blue-600" />;
      default: return <FileIcon size={20} className="text-gray-400" />;
    }
  };

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
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-cerulean/10 rounded-2xl text-brand-cerulean">
          <FolderOpen size={22} className="opacity-90" />
        </div>
        <h2 className="text-2xl font-semibold text-brand-prussian tracking-tight">
          Study Materials
        </h2>
      </div>

      {materials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((file) => (
            <div 
              key={file._id} 
              className="bg-white p-5 rounded-[2rem] border border-brand-aliceBlue flex items-center justify-between group hover:border-brand-cerulean/20 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                {/* Dynamic Icon Container */}
                <div className="w-12 h-12 shrink-0 bg-brand-aliceBlue/50 rounded-2xl flex items-center justify-center transition-colors duration-300">
                  {getFileIcon(file.fileType)}
                </div>
                
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-brand-prussian truncate w-full tracking-tight" title={file.title}>
                    {file.title}
                  </h4>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                     <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                       {file.fileSize}
                     </p>
                     {/* Description tooltip/text */}
                     {file.description && (
                        <p className="text-[10px] text-gray-400 truncate w-32">{file.description}</p>
                     )}
                  </div>
                </div>
              </div>
              
              <a 
                href={`${import.meta.env.VITE_API_BASE_URL}${file.fileUrl}`} 
                target="_blank" 
                rel="noreferrer"
                download
                className="p-2.5 bg-brand-aliceBlue text-gray-500 rounded-xl group-hover:bg-brand-prussian group-hover:text-white transition-all transform active:scale-90"
                title="Download File"
              >
                <Download size={18} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-brand-aliceBlue">
          <div className="w-16 h-16 bg-brand-aliceBlue/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileCode className="text-brand-cerulean/40" size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-brand-prussian tracking-tight">
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