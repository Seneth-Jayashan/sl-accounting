import { useEffect, useState, useCallback } from "react";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Filter,
  RotateCw,
  Pencil,
  X
} from "lucide-react";
import moment from "moment";

// Services
import AnnouncementService, { type AnnouncementData } from "../../../services/AnnouncementService";
import ClassService, { type ClassData } from "../../../services/ClassService";

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track if we are editing an existing announcement
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({ title: "", content: "", classId: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, classRes] = await Promise.all([
        AnnouncementService.getAllAnnouncements(filterClass),
        ClassService.getAllClasses()
      ]);

      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);

      if (classRes && classRes.classes) {
        setClasses(classRes.classes);
      } else if (Array.isArray(classRes)) {
        setClasses(classRes);
      }
      
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle Edit Initialization
  const handleEditClick = (ann: AnnouncementData) => {
    setEditingId(ann._id);
    setFormData({
      title: ann.title,
      content: ann.content,
      classId: (ann.class && typeof ann.class === 'object') ? (ann.class as any)._id : ann.class as string
    });
    setIsModalOpen(true);
  };

  // Close Modal and Reset Form
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", content: "", classId: "" });
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      await AnnouncementService.toggleVisibility(id);
      setAnnouncements(prev => prev.map(ann => 
        ann._id === id ? { ...ann, isPublished: !ann.isPublished } : ann
      ));
    } catch (err) { alert("Failed to update visibility"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement permanently?")) return;
    try {
      await AnnouncementService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(ann => ann._id !== id));
    } catch (err) { alert("Delete failed"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.classId) return alert("Please select a class");
    
    try {
      if (editingId) {
        await AnnouncementService.updateAnnouncement(editingId, formData);
      } else {
        await AnnouncementService.createAnnouncement(formData);
      }
      closeModal();
      loadData(); 
    } catch (err) { alert(editingId ? "Update failed" : "Creation failed"); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">Class Announcements</h1>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Broadcast updates to specific academic modules.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-cerulean text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-brand-prussian transition-all active:scale-95 shadow-lg shadow-brand-cerulean/20"
        >
          <Plus size={18} /> New Announcement
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-brand-aliceBlue shadow-sm">
        <div className="flex-1 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-brand-aliceBlue/30 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-cerulean/20 outline-none appearance-none"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All Academic Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-brand-cerulean opacity-50" />
          <p className="mt-4 text-sm font-medium text-gray-400 uppercase tracking-widest">Loading Broadcasts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div key={ann._id} className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-brand-aliceBlue hover:border-brand-cerulean/10 transition-all group shadow-sm flex flex-col gap-4">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 order-2 sm:order-1">
                    <span className="text-[10px] font-bold text-brand-cerulean bg-brand-aliceBlue px-3 py-1 rounded-lg uppercase tracking-widest line-clamp-1">
                      {ann.classDetails?.name || "Class Linked"}
                    </span>
                    <span className="text-xs text-gray-400 font-medium italic">
                      {moment(ann.createdAt).format("MMM DD, YYYY")}
                    </span>
                  </div>
                  
                  {/* Actions - Top Right on Desktop, Row on Mobile */}
                  <div className="flex gap-1 order-1 sm:order-2 self-end sm:self-auto">
                    <button 
                      onClick={() => handleEditClick(ann)}
                      className="p-2 sm:p-2.5 hover:bg-brand-aliceBlue rounded-xl transition-colors text-gray-400 hover:text-brand-cerulean"
                      title="Edit Announcement"
                    >
                      <Pencil size={18} />
                    </button>

                    <button 
                      onClick={() => handleToggleVisibility(ann._id)} 
                      className="p-2 sm:p-2.5 hover:bg-brand-aliceBlue rounded-xl transition-colors"
                      title={ann.isPublished ? "Hide from students" : "Show to students"}
                    >
                      {ann.isPublished ? <Eye size={18} className="text-green-500" /> : <EyeOff size={18} className="text-gray-400" />}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(ann._id)} 
                      className="p-2 sm:p-2.5 hover:bg-red-50 text-brand-coral rounded-xl transition-colors"
                      title="Delete Forever"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-brand-prussian mb-2 group-hover:text-brand-cerulean transition-colors">{ann.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-normal whitespace-pre-line">{ann.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-10 sm:p-20 text-center border-2 border-dashed border-brand-aliceBlue">
              <Megaphone className="mx-auto text-brand-aliceBlue/40 mb-4" size={40} strokeWidth={1.5} />
              <p className="text-gray-400 font-medium text-sm">No announcements found for this selection.</p>
            </div>
          )}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-prussian/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button Mobile */}
            <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 sm:hidden"
            >
                <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-brand-prussian mb-6 sm:mb-8 tracking-tight pr-8 sm:pr-0">
              {editingId ? "Update Broadcast" : "Create New Broadcast"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 sm:mb-3">Target Academic Class</label>
                <select 
                  required
                  className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none outline-none text-sm font-medium appearance-none"
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">Select a class...</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 sm:mb-3">Announcement Subject</label>
                <input 
                  type="text" required
                  className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none outline-none text-sm font-medium placeholder:text-gray-400"
                  placeholder="e.g. Important Update regarding Exams"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 sm:mb-3">Detailed Content</label>
                <textarea 
                  required rows={5}
                  className="w-full p-3 sm:p-4 bg-brand-aliceBlue/50 rounded-xl sm:rounded-2xl border-none outline-none text-sm font-medium resize-none placeholder:text-gray-400"
                  placeholder="Enter the message you want to broadcast to the class..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="flex gap-3 sm:gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 py-3 sm:py-4 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 sm:py-4 text-sm font-semibold bg-brand-cerulean text-white rounded-xl sm:rounded-2xl shadow-xl shadow-brand-cerulean/20 hover:bg-brand-prussian transition-all"
                >
                  {editingId ? "Save Changes" : "Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}