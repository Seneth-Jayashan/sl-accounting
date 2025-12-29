import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import BatchService, { type BatchData, type BatchPayload } from "../../../services/BatchService";

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CalendarDaysIcon,
  EyeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function BatchPage() {
  const navigate = useNavigate();

  // --- State ---
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  // --- API Calls ---
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BatchService.getAllBatches(false);
      setBatches(data.batches || []);
    } catch (error) {
      console.error("Failed to load batches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (batch?: BatchData) => {
    if (batch) {
      setFormData({
        name: batch.name,
        description: batch.description || "",
        startDate: moment(batch.startDate).format("YYYY-MM-DD"),
        endDate: moment(batch.endDate).format("YYYY-MM-DD"),
        isActive: batch.isActive,
      });
      setCurrentId(batch._id);
      setIsEditing(true);
    } else {
      setFormData(INITIAL_FORM_STATE);
      setIsEditing(false);
      setCurrentId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert("Validation Error: End date must be after start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: BatchPayload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (isEditing && currentId) {
        await BatchService.updateBatch(currentId, payload);
      } else {
        await BatchService.createBatch(payload);
      }

      setIsModalOpen(false);
      fetchBatches();
    } catch (error: any) {
      alert(error.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This will affect linked classes and students.")) return;
    try {
      await BatchService.deleteBatch(id);
      setBatches((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      alert("Failed to delete batch.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic UI Update
    const originalBatches = [...batches];
    setBatches(prev => prev.map(b => b._id === id ? { ...b, isActive: !currentStatus } : b));

    try {
      await BatchService.toggleStatus(id);
    } catch (error) {
      alert("Failed to update status. Reverting changes.");
      setBatches(originalBatches);
    }
  };

  return (
      <div className="max-w-7xl mx-auto space-y-6 pb-24 md:p-6 px-4 pt-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian">Batch Management</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Manage academic schedules and enrollment periods.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-brand-cerulean/20 active:scale-95"
          >
            <PlusIcon className="w-5 h-5 stroke-[3px]" />
            New Batch
          </button>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <ArrowPathIcon className="w-10 h-10 text-brand-cerulean animate-spin" />
             <p className="text-brand-prussian font-medium animate-pulse">Syncing batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <EmptyState onAdd={() => openModal()} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Desktop Table */}
            <div className="bg-white border border-brand-aliceBlue rounded-[2rem] overflow-hidden shadow-sm hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-aliceBlue/30 text-[11px] uppercase tracking-[0.15em] text-brand-prussian/60 font-bold">
                  <tr>
                    <th className="px-8 py-5">Batch Identity</th>
                    <th className="px-8 py-5">Academic Period</th>
                    <th className="px-8 py-5">Visibility</th>
                    <th className="px-8 py-5 text-right">Control Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-aliceBlue/50">
                  {batches.map((batch) => (
                    <BatchRow 
                      key={batch._id} 
                      batch={batch} 
                      onEdit={() => openModal(batch)}
                      onDelete={() => handleDelete(batch._id)}
                      onToggle={() => handleToggleStatus(batch._id, batch.isActive)}
                      onView={() => navigate(`/admin/batches/view/${batch._id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
               {batches.map(batch => (
                 <MobileBatchCard 
                   key={batch._id} 
                   batch={batch} 
                   onView={() => navigate(`/admin/batches/view/${batch._id}`)}
                   onEdit={() => openModal(batch)}
                   onDelete={() => handleDelete(batch._id)}
                   onToggle={() => handleToggleStatus(batch._id, batch.isActive)}
                 />
               ))}
            </div>
          </div>
        )}

        {/* --- Modal --- */}
        <AnimatePresence>
          {isModalOpen && (
            <BatchModal 
              isOpen={isModalOpen}
              isEditing={isEditing}
              formData={formData}
              submitting={submitting}
              onClose={() => setIsModalOpen(false)}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </div>
  );
}

// --- Sub-components ---

const BatchRow = ({ batch, onEdit, onDelete, onToggle, onView }: any) => (
  <tr className="group hover:bg-brand-aliceBlue/10 transition-colors">
    <td className="px-8 py-5">
      <div onClick={onView} className="font-bold text-brand-prussian cursor-pointer hover:text-brand-cerulean transition-colors flex items-center gap-2">
        {batch.name}
      </div>
      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">{batch.description || "No description provided"}</div>
    </td>
    <td className="px-8 py-5">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
           <span className="text-xs font-bold text-brand-prussian">{moment(batch.startDate).format("DD MMM YYYY")}</span>
           <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Start Date</span>
        </div>
        <div className="h-4 w-px bg-gray-200 mx-1"></div>
        <div className="flex flex-col">
           <span className="text-xs font-bold text-brand-prussian">{moment(batch.endDate).format("DD MMM YYYY")}</span>
           <span className="text-[10px] text-gray-400 uppercase tracking-tighter">End Date</span>
        </div>
      </div>
    </td>
    <td className="px-8 py-5">
      <StatusBadge active={batch.isActive} onClick={onToggle} />
    </td>
    <td className="px-8 py-5 text-right">
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton Icon={EyeIcon} onClick={onView} variant="primary" />
        <IconButton Icon={PencilSquareIcon} onClick={onEdit} variant="primary" />
        <IconButton Icon={TrashIcon} onClick={onDelete} variant="danger" />
      </div>
    </td>
  </tr>
);

const MobileBatchCard = ({ batch, onView, onEdit, onDelete, onToggle }: any) => (
  <div className="bg-white p-5 rounded-[2rem] border border-brand-aliceBlue shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-brand-prussian text-lg leading-tight">{batch.name}</h3>
        <p className="text-xs text-gray-400 mt-1">{moment(batch.startDate).format("MMM YYYY")} - {moment(batch.endDate).format("MMM YYYY")}</p>
      </div>
      <StatusBadge active={batch.isActive} onClick={onToggle} />
    </div>
    
    <div className="grid grid-cols-3 gap-2 border-t border-brand-aliceBlue pt-4">
      <button onClick={onView} className="py-2.5 bg-brand-aliceBlue text-brand-prussian font-bold rounded-xl text-xs flex items-center justify-center gap-1">
          <EyeIcon className="w-4 h-4" /> View
      </button>
      <button onClick={onEdit} className="py-2.5 bg-brand-aliceBlue text-brand-prussian font-bold rounded-xl text-xs flex items-center justify-center gap-1">
          <PencilSquareIcon className="w-4 h-4" /> Edit
      </button>
      <button onClick={onDelete} className="py-2.5 bg-red-50 text-red-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1">
          <TrashIcon className="w-4 h-4" /> Delete
      </button>
    </div>
  </div>
);

const BatchModal = ({ isEditing, formData, submitting, onClose, onChange, onSubmit }: any) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="absolute inset-0 bg-brand-prussian/40 backdrop-blur-md" 
    />
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
    >
      <div className="px-6 py-5 md:px-8 md:py-6 border-b border-brand-aliceBlue flex justify-between items-center bg-brand-aliceBlue/10 sticky top-0 backdrop-blur-sm z-20">
        <h2 className="text-lg md:text-xl font-black text-brand-prussian">{isEditing ? "Modify Batch" : "Create New Batch"}</h2>
        <button onClick={onClose} className="p-2 hover:bg-brand-aliceBlue rounded-full text-brand-prussian transition-colors"><XMarkIcon className="w-6 h-6"/></button>
      </div>
      
      <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-5">
        <InputGroup label="Batch Name" name="name" value={formData.name} onChange={onChange} placeholder="e.g. 2025 AL Advanced" required />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup label="Commencement" name="startDate" type="date" value={formData.startDate} onChange={onChange} required />
          <InputGroup label="Conclusion" name="endDate" type="date" value={formData.endDate} onChange={onChange} required />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-black text-brand-cerulean mb-2">Internal Description</label>
          <textarea 
            name="description" value={formData.description} onChange={onChange}
            className="w-full bg-brand-aliceBlue/30 border-2 border-transparent focus:border-brand-cerulean rounded-2xl p-4 text-sm font-medium outline-none transition-all"
            rows={3} placeholder="Add notes about this batch..."
          />
        </div>

        <button 
          type="submit" disabled={submitting}
          className="w-full bg-brand-cerulean hover:bg-brand-prussian disabled:bg-gray-300 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-brand-cerulean/30"
        >
          {submitting ? "Processing..." : isEditing ? "Update Schedule" : "Initialize Batch"}
        </button>
      </form>
    </motion.div>
  </div>
);

const StatusBadge = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
      active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-brand-aliceBlue text-brand-prussian/40 hover:bg-brand-aliceBlue/80"
    }`}
  >
    <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
    {active ? "Active" : "Hidden"}
  </button>
);

const IconButton = ({ Icon, onClick, variant }: any) => (
  <button 
    onClick={onClick} 
    className={`p-2 rounded-xl transition-all active:scale-90 ${
      variant === "danger" ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white" : "bg-brand-aliceBlue text-brand-prussian hover:bg-brand-cerulean hover:text-white"
    }`}
  >
    <Icon className="w-5 h-5 stroke-2" />
  </button>
);

const InputGroup = ({ label, ...props }: any) => (
  <div>
    <label className="block text-[10px] uppercase tracking-widest font-black text-brand-cerulean mb-2">{label}</label>
    <input 
      {...props}
      className="w-full bg-brand-aliceBlue/30 border-2 border-transparent focus:border-brand-cerulean rounded-2xl p-4 text-sm font-bold outline-none transition-all placeholder:text-gray-300"
    />
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-brand-aliceBlue mx-4 md:mx-0">
    <div className="w-20 h-20 bg-brand-aliceBlue rounded-full flex items-center justify-center mx-auto mb-6">
      <CalendarDaysIcon className="w-10 h-10 text-brand-cerulean" />
    </div>
    <h3 className="text-xl font-black text-brand-prussian">No Active Batches</h3>
    <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Start by creating a batch to organize your academic classes and student groups.</p>
    <button onClick={onAdd} className="mt-8 bg-brand-prussian text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-cerulean transition-colors">
      Get Started
    </button>
  </div>
);