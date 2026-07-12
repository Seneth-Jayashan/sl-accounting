import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, 
  Trash2, 
  FileText, 
  Presentation, 
  FileEdit, 
  Image as ImageIcon,
  File as FileIcon,
  RotateCw,
  Search,
  Download,
  Pencil,
  X
} from "lucide-react";
import moment from "moment";
import Swal from "sweetalert2";

// Services
import MaterialService, { type MaterialData } from "../../../services/MaterialService";
import ClassService, { type ClassData } from "../../../services/ClassService";

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", classId: "" });
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, classRes] = await Promise.all([
        MaterialService.getAllMaterials(filterClass),
        ClassService.getAllClasses()
      ]);

      // --- 1. ROBUST CHECK FOR MATERIALS ---
      let extractedMaterials: MaterialData[] = [];
      if (Array.isArray(matRes)) {
        extractedMaterials = matRes;
      } else if ((matRes as any)?.data && Array.isArray((matRes as any).data)) {
        extractedMaterials = (matRes as any).data;
      } else if ((matRes as any)?.materials && Array.isArray((matRes as any).materials)) {
        extractedMaterials = (matRes as any).materials;
      }
      setMaterials(extractedMaterials);

      // --- 2. ROBUST CHECK FOR CLASSES ---
      let extractedClasses: ClassData[] = [];
      if (classRes?.classes && Array.isArray(classRes.classes)) {
        extractedClasses = classRes.classes;
      } else if (Array.isArray(classRes)) {
        extractedClasses = classRes as unknown as ClassData[];
      } else if ((classRes as any).data && Array.isArray((classRes as any).data)) {
        extractedClasses = (classRes as any).data;
      }
      setClasses(extractedClasses);

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEditClick = (mat: MaterialData) => {
    setEditingId(mat._id);
    
    // Logic to handle both populated and unpopulated class field
    const cid = typeof mat.class === 'object' && mat.class !== null 
                ? (mat.class as any)._id 
                : mat.class;

    setFormData({
      title: mat.title,
      description: mat.description || "",
      classId: cid || ""
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", description: "", classId: "" });
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId && !selectedFile) {
      Swal.fire("Warning", "Please select a file", "warning");
      return;
    }
    if (!formData.classId) {
      Swal.fire("Warning", "Please select a target class", "warning");
      return;
    }

    const data = new FormData();
    if (selectedFile) data.append("file", selectedFile);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("classId", formData.classId);

    setIsUploading(true);
    try {
      if (editingId) {
        await MaterialService.updateMaterial(editingId, data);
      } else {
        await MaterialService.uploadMaterial(data); 
      }
      closeModal();
      loadData();
      Swal.fire("Success", editingId ? "Resource updated successfully!" : "Resource uploaded successfully!", "success");
    } catch (err) {
      Swal.fire("Error", "Action failed. Check server constraints.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="text-red-500 w-5 h-5 stroke-[2]" />;
      case "pptx": return <Presentation className="text-orange-500 w-5 h-5 stroke-[2]" />;
      case "image": return <ImageIcon className="text-blue-500 w-5 h-5 stroke-[2]" />;
      case "docx": return <FileEdit className="text-blue-600 w-5 h-5 stroke-[2]" />;
      default: return <FileText className="text-gray-500 w-5 h-5 stroke-[2]" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 sm:px-6 w-full overflow-x-hidden">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 mb-2">
        <div>
          <h1 className="text-xl md:text-[22px] font-bold text-gray-900 tracking-tight leading-tight">Academic Materials</h1>
          <p className="text-gray-500 text-xs mt-0.5 font-medium">Broadcast study resources and lecture notes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0d4b5b] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#093946] transition-colors active:scale-95 shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} /> Upload Materials
        </button>
      </header>

      {/* Filter Bar */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <select 
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none appearance-none text-gray-700 shadow-sm"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">Search by class module...</option>
          {classes && classes.length > 0 ? (
            classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)
          ) : (
            <option disabled>No classes found...</option>
          )}
        </select>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#0d4b5b] opacity-30" />
          <p className="text-[11px] font-bold text-gray-400 mt-4 uppercase tracking-widest">Syncing Materials...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {materials.map((mat) => (
            <div key={mat._id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-[#f8fafc] rounded-full flex items-center justify-center shrink-0 border border-gray-100">
                  {getFileIcon(mat.fileType)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(mat)} className="p-1.5 text-[#0d4b5b] hover:bg-[#eef2f6] rounded-md transition-colors"><Pencil size={16} strokeWidth={2.5} /></button>
                  <button onClick={async () => {
                    const result = await Swal.fire({
                      title: 'Are you sure?',
                      text: "You are about to delete this material. This action cannot be undone.",
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#3085d6',
                      confirmButtonText: 'Yes, delete it!'
                    });
                    if (result.isConfirmed) {
                      MaterialService.deleteMaterial(mat._id).then(() => {
                        Swal.fire("Deleted!", "The material has been deleted.", "success");
                        loadData();
                      });
                    }
                  }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} strokeWidth={2.5} /></button>
                </div>
              </div>

              <div className="space-y-1 mb-6 flex-1 mt-1">
                <h4 className="text-[14px] font-bold text-gray-800 line-clamp-2 leading-tight">{mat.title}</h4>
                <p className="text-[12px] text-gray-500 font-medium line-clamp-2">{mat.description || (typeof mat.class === 'object' ? (mat.class as any)?.name : "No description")}</p>
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 mt-4">
                  <span>{mat.fileSize || "1.35 MB"}</span>
                  <span>•</span>
                  <span>{moment(mat.createdAt).format("MMM YY")}</span>
                </div>
              </div>

              <a 
                 href={`${import.meta.env.VITE_API_BASE_URL}${mat.fileUrl}`} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#0d4b5b] text-white rounded-xl text-[13px] font-bold hover:bg-[#093946] transition-all shadow-sm active:scale-[0.98]"
              >
                <Download size={16} strokeWidth={2.5} /> Download File
              </a>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0d4b5b]/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[480px] rounded-[20px] p-6 shadow-2xl overflow-y-auto max-h-[90vh] relative">
            
            <h2 className="text-[15px] font-black text-gray-800 uppercase tracking-wide mb-4 mt-1">
              {editingId ? "Update Resource" : "Post New Resource"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">Target Academic Class</label>
                <select 
                  required className="w-full bg-white border border-gray-100 focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] rounded-lg px-4 py-2 outline-none transition-all text-[13px] font-medium text-gray-500 cursor-pointer appearance-none"
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">Select a class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">Resource Title</label>
                <input 
                  type="text" required
                  className="w-full bg-white border border-gray-100 focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] rounded-lg px-4 py-2 outline-none transition-all text-[13px] font-medium text-gray-500 placeholder:text-gray-300"
                  placeholder="eg: Week 01 Lecture Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">Instructional Description</label>
                <textarea 
                  rows={2}
                  className="w-full bg-white border border-gray-100 focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] rounded-lg px-4 py-2 outline-none transition-all text-[13px] font-medium text-gray-500 resize-none placeholder:text-gray-300"
                  placeholder="Explain what this file covers..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">Upload File (PDF, PPTX, etc.)</label>
                <div className="relative">
                   <input 
                    type="file" 
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                    className="w-full text-[13px] text-gray-400 file:mr-4 file:py-1.5 file:px-5 file:rounded-md file:border-0 file:text-[12px] file:font-bold file:bg-[#0d4b5b] file:text-white hover:file:bg-[#093946] cursor-pointer bg-white border border-gray-100 rounded-lg file:m-1"
                  />
                </div>
                {editingId && <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Leave empty to keep the current file.</p>}
              </div>

              <div className="flex gap-4 pt-3 pb-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-[#0d4b5b] font-bold text-[13px] hover:bg-gray-50 transition-colors shadow-sm">
                  Discard
                </button>
                <button 
                  type="submit" disabled={isUploading}
                  className="flex-1 py-2 rounded-lg bg-[#0d4b5b] text-white font-bold text-[13px] hover:bg-[#093946] transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isUploading && <RotateCw className="w-4 h-4 animate-spin" />}
                  {isUploading ? "Processing..." : editingId ? "Update Resource" : "Upload Now"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}