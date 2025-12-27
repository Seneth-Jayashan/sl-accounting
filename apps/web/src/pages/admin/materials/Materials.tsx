import { useEffect, useState, useCallback } from "react";
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
  Pencil
} from "lucide-react";
import moment from "moment";

// Layouts & Services
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
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

      // Handle Materials Data
      const materialsData = matRes.data;
      if (Array.isArray(materialsData)) {
        setMaterials(materialsData);
      } else if (materialsData) {
        setMaterials([materialsData as MaterialData]);
      } else {
        setMaterials([]);
      }

      // Handle Class Data - FIX: Accessing .classes from ClassResponse
      if (classRes && classRes.classes) {
        setClasses(classRes.classes);
      } else if (Array.isArray(classRes)) {
        setClasses(classRes as any);
      } else {
        setClasses([]);
      }

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
    
    if (!editingId && !selectedFile) return alert("Please select a file");
    if (!formData.classId) return alert("Please select a target class");

    const data = new FormData();
    if (selectedFile) data.append("file", selectedFile);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("classId", formData.classId);

    setIsUploading(true);
    try {
      // Note: If you have a separate updateMaterial service, use it here.
      // Otherwise, assume uploadMaterial handles both based on content.
      await MaterialService.uploadMaterial(data); 
      closeModal();
      loadData();
    } catch (err) {
      alert("Action failed. Check server constraints.");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="text-red-500" />;
      case "pptx": return <Presentation className="text-orange-500" />;
      case "image": return <ImageIcon className="text-blue-500" />;
      case "docx": return <FileEdit className="text-blue-600" />;
      default: return <FileIcon className="text-gray-400" />;
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-brand-prussian tracking-tight">Academic Materials</h1>
            <p className="text-gray-500 text-sm font-medium">Broadcast study resources and lecture notes.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-cerulean text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-brand-prussian transition-all active:scale-95 shadow-lg shadow-brand-cerulean/20"
          >
            <Plus size={18} /> Upload Material
          </button>
        </header>

        <div className="bg-white p-5 rounded-[2rem] border border-brand-aliceBlue shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-brand-aliceBlue/30 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-cerulean/20 outline-none appearance-none"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">Search by Class Module...</option>
              {classes && classes.length > 0 ? (
                classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)
              ) : (
                <option disabled>No classes loaded</option>
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-brand-cerulean opacity-30" />
            <p className="text-xs font-medium text-gray-400 mt-4 uppercase tracking-widest">Syncing Materials...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((mat) => (
              <div key={mat._id} className="bg-white p-6 rounded-[2.5rem] border border-brand-aliceBlue hover:border-brand-cerulean/10 transition-all group shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-brand-aliceBlue/50 rounded-2xl flex items-center justify-center">
                    {getFileIcon(mat.fileType)}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditClick(mat)} className="p-2 text-gray-300 hover:text-brand-cerulean transition-colors"><Pencil size={18} /></button>
                    <button onClick={() => MaterialService.deleteMaterial(mat._id).then(loadData)} className="p-2 text-gray-300 hover:text-brand-coral transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="text-base font-semibold text-brand-prussian line-clamp-1">{mat.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5rem]">{mat.description || "No description provided."}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{mat.fileSize}</span>
                    <span>•</span>
                    <span>{moment(mat.createdAt).format("MMM DD")}</span>
                  </div>
                </div>

                <a 
                   href={`${import.meta.env.VITE_API_BASE_URL}${mat.fileUrl}`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 w-full py-3 bg-brand-aliceBlue text-brand-prussian rounded-xl text-xs font-semibold hover:bg-brand-prussian hover:text-white transition-all shadow-sm active:scale-[0.98]"
                >
                  <Download size={14} /> Download File
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-prussian/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide">
            <h2 className="text-2xl font-semibold text-brand-prussian mb-8 tracking-tight">
              {editingId ? "Update Resource" : "Post New Resource"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Target Academic Class</label>
                <select 
                  required className="w-full p-4 bg-brand-aliceBlue/50 rounded-2xl border-none text-sm font-medium outline-none appearance-none"
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">Select a class...</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Resource Title</label>
                <input 
                  type="text" required
                  className="w-full p-4 bg-brand-aliceBlue/50 rounded-2xl border-none text-sm font-medium outline-none"
                  placeholder="e.g. Week 1 Lecture Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Instructional Description</label>
                <textarea 
                  rows={3}
                  className="w-full p-4 bg-brand-aliceBlue/50 rounded-2xl border-none text-sm font-medium outline-none resize-none"
                  placeholder="Explain what this file covers..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Upload File (PDF, PPTX, etc.)</label>
                <div className="relative">
                   <input 
                    type="file" 
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-brand-cerulean file:text-white hover:file:bg-brand-prussian cursor-pointer bg-brand-aliceBlue/30 p-2 rounded-2xl"
                  />
                </div>
                {editingId && <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Leave empty to keep the current file.</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">Discard</button>
                <button 
                  type="submit" disabled={isUploading}
                  className="flex-1 py-4 text-sm font-semibold bg-brand-cerulean text-white rounded-2xl shadow-xl shadow-brand-cerulean/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading && <RotateCw className="w-4 h-4 animate-spin" />}
                  {isUploading ? "Processing..." : editingId ? "Update Resource" : "Upload Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}