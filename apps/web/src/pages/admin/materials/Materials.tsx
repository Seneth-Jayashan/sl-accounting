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
  Pencil,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers
} from "lucide-react";
import moment from "moment";

// Services
import MaterialService, { type MaterialData } from "../../../services/MaterialService";
import ClassService, { type ClassData } from "../../../services/ClassService";
import MaterialCategoryService, { type MaterialCategoryData } from "../../../services/MaterialCategoryService";

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Accordion State
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", classId: "", categoryId: "" });
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, classRes, catRes] = await Promise.all([
        MaterialService.getAllMaterials(filterClass),
        ClassService.getAllClasses(),
        MaterialCategoryService.getAllCategories()
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
      
      setCategories(catRes || []);

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

    const catId = typeof mat.category === 'object' && mat.category !== null 
                ? (mat.category as any)._id 
                : mat.category;

    setFormData({
      title: mat.title,
      description: mat.description || "",
      classId: cid || "",
      categoryId: catId || ""
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", description: "", classId: "", categoryId: "" });
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId && !selectedFile) return alert("Please select a file");
    if (!formData.classId) return alert("Please select a target class");
    if (!formData.categoryId) return alert("Please select a category");

    const data = new FormData();
    if (selectedFile) data.append("file", selectedFile);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("classId", formData.classId);
    data.append("categoryId", formData.categoryId);

    setIsUploading(true);
    try {
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
      case "pdf": return <FileText className="text-red-500 w-6 h-6" />;
      case "pptx": return <Presentation className="text-orange-500 w-6 h-6" />;
      case "image": return <ImageIcon className="text-blue-500 w-6 h-6" />;
      case "docx": return <FileEdit className="text-blue-600 w-6 h-6" />;
      default: return <FileIcon className="text-gray-400 w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">Academic Materials</h1>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Broadcast study resources and lecture notes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-brand-prussian border border-brand-aliceBlue px-5 py-3 rounded-xl text-sm font-medium hover:border-brand-cerulean/30 transition-all active:scale-95 shadow-sm"
          >
            Manage Categories
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-brand-cerulean text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-brand-prussian transition-all active:scale-95 shadow-lg shadow-brand-cerulean/20"
          >
            <Plus size={18} /> Upload Material
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-brand-aliceBlue shadow-sm">
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
              <option disabled>No classes found...</option>
            )}
          </select>
        </div>
      </div>

      {/* Content Grid (Grouped by Class -> Category) */}
      {loading ? (
        <div className="py-24 text-center">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-brand-cerulean opacity-30" />
          <p className="text-xs font-medium text-gray-400 mt-4 uppercase tracking-widest">Syncing Materials...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            // 1. Group by Class
            const groupedByClass: Record<string, { className: string; categories: Record<string, MaterialData[]> }> = {};
            
            materials.forEach(mat => {
              const classObj = mat.classDetails || (typeof mat.class === 'object' ? mat.class : null);
              const classId = classObj?._id || mat.class || 'unknown';
              const className = classObj?.name || 'Unknown Class';
              
              const catObj = mat.category;
              const catName = typeof catObj === 'object' && catObj ? catObj.name : 'Uncategorized';

              if (!groupedByClass[classId]) {
                 groupedByClass[classId] = { className, categories: {} };
              }
              if (!groupedByClass[classId].categories[catName]) {
                 groupedByClass[classId].categories[catName] = [];
              }
              groupedByClass[classId].categories[catName].push(mat);
            });

            const classEntries = Object.entries(groupedByClass);
            
            if (classEntries.length === 0) {
              return (
                <div className="bg-white p-10 rounded-[2rem] border border-brand-aliceBlue text-center">
                  <FileIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm font-medium">No materials found.</p>
                </div>
              );
            }

            return classEntries.map(([classId, classGroup]) => {
              const isClassExpanded = expandedClasses[classId] ?? true; // Default open
              const catEntries = Object.entries(classGroup.categories);
              
              return (
                <div key={classId} className="bg-white border border-brand-aliceBlue rounded-2xl overflow-hidden shadow-sm">
                  {/* Class Header */}
                  <div 
                    onClick={() => setExpandedClasses(p => ({...p, [classId]: !isClassExpanded}))}
                    className="flex justify-between items-center p-5 bg-brand-aliceBlue/30 hover:bg-brand-aliceBlue/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                       <Folder className="text-brand-cerulean w-5 h-5" />
                       <h3 className="font-semibold text-brand-prussian">{classGroup.className}</h3>
                    </div>
                    <div className="text-gray-400">
                      {isClassExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>

                  {/* Class Content (Categories) */}
                  {isClassExpanded && (
                    <div className="p-4 space-y-4">
                      {catEntries.map(([catName, mats]) => {
                        const catKey = `${classId}-${catName}`;
                        const isCatExpanded = expandedCategories[catKey] ?? true; // Default open

                        return (
                          <div key={catKey} className="border border-brand-aliceBlue/50 rounded-xl overflow-hidden">
                            {/* Category Header */}
                            <div 
                              onClick={() => setExpandedCategories(p => ({...p, [catKey]: !isCatExpanded}))}
                              className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                 <Layers className="text-gray-500 w-4 h-4" />
                                 <h4 className="font-medium text-sm text-brand-prussian">{catName} <span className="text-xs text-gray-400 ml-2 bg-gray-200 px-2 py-0.5 rounded-full">{mats.length} files</span></h4>
                              </div>
                              <div className="text-gray-400">
                                {isCatExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </div>
                            </div>

                            {/* Materials Grid */}
                            {isCatExpanded && (
                              <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {mats.map((mat) => (
                                  <div key={mat._id} className="p-4 rounded-xl border border-brand-aliceBlue hover:border-brand-cerulean/20 transition-all group flex flex-col h-full bg-white shadow-sm hover:shadow-md">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="w-10 h-10 bg-brand-aliceBlue/50 rounded-xl flex items-center justify-center shrink-0">
                                        {getFileIcon(mat.fileType)}
                                      </div>
                                      <div className="flex gap-1">
                                        <button onClick={() => handleEditClick(mat)} className="p-1.5 text-gray-300 hover:text-brand-cerulean transition-colors"><Pencil size={16} /></button>
                                        <button onClick={() => MaterialService.deleteMaterial(mat._id).then(loadData)} className="p-1.5 text-gray-300 hover:text-brand-coral transition-colors"><Trash2 size={16} /></button>
                                      </div>
                                    </div>
                                    <div className="space-y-1 mb-4 flex-1">
                                      <h4 className="text-sm font-semibold text-brand-prussian line-clamp-2 leading-tight">{mat.title}</h4>
                                      <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">{mat.description || "No description."}</p>
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                        <span>{mat.fileSize}</span>
                                        <span>•</span>
                                        <span>{moment(mat.createdAt).format("MMM DD")}</span>
                                      </div>
                                    </div>
                                    <a 
                                      href={`${import.meta.env.VITE_API_BASE_URL}${mat.fileUrl}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="flex items-center justify-center gap-2 w-full py-2 bg-brand-aliceBlue/50 text-brand-prussian rounded-lg text-xs font-semibold hover:bg-brand-prussian hover:text-white transition-all shadow-sm"
                                    >
                                      <Download size={14} /> Download
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-prussian/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl overflow-y-auto max-h-[90vh] relative">
            
            {/* Close Button Mobile */}
            <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 sm:hidden"
            >
                <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-brand-prussian mb-6 sm:mb-8 tracking-tight pr-8 sm:pr-0">
              {editingId ? "Update Resource" : "Post New Resource"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Target Academic Class</label>
                <select 
                  required className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none text-sm font-medium outline-none appearance-none"
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">Select a class...</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                <select 
                  required className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none text-sm font-medium outline-none appearance-none"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="">Select a category...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Resource Title</label>
                <input 
                  type="text" required
                  className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none text-sm font-medium outline-none"
                  placeholder="e.g. Week 1 Lecture Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Instructional Description</label>
                <textarea 
                  rows={3}
                  className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none text-sm font-medium outline-none resize-none"
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
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-brand-cerulean file:text-white hover:file:bg-brand-prussian cursor-pointer bg-brand-aliceBlue/30 p-2 rounded-xl sm:rounded-2xl"
                  />
                </div>
                {editingId && <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Leave empty to keep the current file.</p>}
              </div>

              <div className="flex gap-3 sm:gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 sm:py-4 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all">Discard</button>
                <button 
                  type="submit" disabled={isUploading}
                  className="flex-1 py-3 sm:py-4 text-sm font-semibold bg-brand-cerulean text-white rounded-xl sm:rounded-2xl shadow-xl shadow-brand-cerulean/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading && <RotateCw className="w-4 h-4 animate-spin" />}
                  {isUploading ? "Processing..." : editingId ? "Update Resource" : "Upload Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MANAGE CATEGORIES MODAL --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-prussian/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl overflow-y-auto max-h-[90vh] relative">
            <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
            >
                <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-brand-prussian mb-6 sm:mb-8 tracking-tight pr-8 sm:pr-0">
              Manage Categories
            </h2>

            <div className="space-y-4 mb-8">
              {categories.map(cat => (
                <div key={cat._id} className="flex justify-between items-center p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl">
                  <span className="font-semibold text-brand-prussian text-sm">{cat.name}</span>
                  <button 
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this category?")) {
                        await MaterialCategoryService.deleteCategory(cat._id);
                        loadData();
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-brand-coral transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No categories created yet.</p>}
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCategoryName.trim()) return;
              try {
                await MaterialCategoryService.createCategory(newCategoryName);
                setNewCategoryName("");
                loadData();
              } catch (err) {
                alert("Failed to create category");
              }
            }} className="flex gap-2">
              <input 
                type="text" required
                className="flex-1 p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none text-sm font-medium outline-none"
                placeholder="New Category Name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button 
                type="submit"
                className="px-6 py-3 sm:py-4 text-sm font-semibold bg-brand-cerulean text-white rounded-xl sm:rounded-2xl shadow-xl shadow-brand-cerulean/20"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}