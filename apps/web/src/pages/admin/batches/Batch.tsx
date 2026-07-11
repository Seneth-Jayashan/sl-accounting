import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
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
      Swal.fire("Validation Error", "End date must be after start date.", "warning");
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
      Swal.fire({
        title: "Success",
        text: isEditing ? "Batch updated successfully!" : "Batch created successfully!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Operation failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Batch?",
      text: "This will affect linked classes and students.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#0d4b5b",
      confirmButtonText: "Yes, delete it!"
    });

    if (!result.isConfirmed) return;

    try {
      await BatchService.deleteBatch(id);
      setBatches((prev) => prev.filter((b) => b._id !== id));
      Swal.fire({ title: "Deleted!", icon: "success", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire("Error", "Failed to delete batch.", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic UI Update
    const originalBatches = [...batches];
    setBatches(prev => prev.map(b => b._id === id ? { ...b, isActive: !currentStatus } : b));

    try {
      await BatchService.toggleStatus(id);
    } catch (error) {
      Swal.fire("Error", "Failed to update status. Reverting changes.", "error");
      setBatches(originalBatches);
    }
  };

  return (
    <div className="w-full space-y-5 pb-12 overflow-x-hidden">

      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-500 text-xs mt-1">Manage academic schedules and enrollment periods.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-[#0d4b5b] hover:bg-[#093946] text-white px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm font-bold shrink-0 w-full sm:w-auto justify-center"
        >
          <PlusIcon className="w-4 h-4 stroke-[2]" /> New Batch
        </button>
      </div>

      {/* --- Content --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col w-full">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
            <ArrowPathIcon className="w-8 h-8 text-[#0d4b5b]/50 animate-spin" />
            <p className="text-[#0d4b5b] text-xs font-bold uppercase tracking-widest animate-pulse">Syncing batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <EmptyState onAdd={() => openModal()} />
        ) : (
          <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block w-full rounded-t-xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-white text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4 w-[35%]">Batch Identity</th>
                    <th className="px-4 py-4 w-[35%]">Academic Period</th>
                    <th className="px-4 py-4 w-[15%]">Visibility</th>
                    <th className="px-4 py-4 text-center w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
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
            <div className="md:hidden space-y-3 w-full p-4">
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
      </div>

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
  <tr className="group hover:bg-gray-50/50 transition-colors">
    <td className="px-4 py-4 align-middle truncate pr-4">
      <div onClick={onView} className="font-bold text-[13px] text-gray-900 cursor-pointer hover:text-[#0d4b5b] transition-colors truncate">
        {batch.name}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 truncate">{batch.description || "No description provided"}</div>
    </td>
    <td className="px-4 py-4 align-middle truncate">
      <div className="flex items-center gap-4 xl:gap-6">
        <div>
          <span className="text-[12px] font-bold text-gray-700 block">{moment(batch.startDate).format("DD MMM YYYY")}</span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Start Date</span>
        </div>
        <div>
          <span className="text-[12px] font-bold text-gray-700 block">{moment(batch.endDate).format("DD MMM YYYY")}</span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">End Date</span>
        </div>
      </div>
    </td>
    <td className="px-4 py-4 align-middle">
      <StatusBadge active={batch.isActive} onClick={onToggle} />
    </td>
    <td className="px-4 py-4 align-middle">
      <div className="flex items-center justify-center gap-1.5 xl:gap-2">
        <IconButton Icon={EyeIcon} onClick={onView} variant="primary" tooltip="Preview" />
        <IconButton Icon={PencilSquareIcon} onClick={onEdit} variant="primary" />
        <IconButton Icon={TrashIcon} onClick={onDelete} variant="danger" tooltip="Delete" />
      </div>
    </td>
  </tr>
);

const MobileBatchCard = ({ batch, onView, onEdit, onDelete, onToggle }: any) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative">
    <div className="flex justify-between items-start mb-3">
      <div className="min-w-0 pr-2">
        <h3 onClick={onView} className="font-bold text-gray-900 text-[13px] truncate cursor-pointer">{batch.name}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{batch.description || "No description"}</p>
      </div>
      <StatusBadge active={batch.isActive} onClick={onToggle} />
    </div>

    <div className="flex items-center gap-4 mb-4">
      <div>
        <span className="text-[11px] font-bold text-gray-700 block">{moment(batch.startDate).format("DD MMM YYYY")}</span>
        <span className="text-[9px] text-gray-400 mt-0.5 block">Start Date</span>
      </div>
      <div>
        <span className="text-[11px] font-bold text-gray-700 block">{moment(batch.endDate).format("DD MMM YYYY")}</span>
        <span className="text-[9px] text-gray-400 mt-0.5 block">End Date</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-3">
      <button onClick={onView} className="py-2 bg-gray-50 text-gray-600 hover:bg-[#0d4b5b] hover:text-white transition-colors font-bold rounded-lg text-[10px] flex items-center justify-center gap-1">
        <EyeIcon className="w-3.5 h-3.5" /> View
      </button>
      <button onClick={onEdit} className="py-2 bg-gray-50 text-gray-600 hover:bg-[#0d4b5b] hover:text-white transition-colors font-bold rounded-lg text-[10px] flex items-center justify-center gap-1">
        <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
      </button>
      <button onClick={onDelete} className="py-2 bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-bold rounded-lg text-[10px] flex items-center justify-center gap-1">
        <TrashIcon className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  </div>
);

const StatusBadge = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold transition-all ${active ? "text-emerald-500" : "text-gray-400"
      }`}
  >
    <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
    {active ? "Active" : "Hidden"}
  </button>
);

const IconButton = ({ Icon, onClick, variant, tooltip }: any) => {
  const isDanger = variant === "danger";

  return (
    <div className="relative group/btn flex flex-col items-center">
      <button
        onClick={onClick}
        className={`p-1.5 rounded-md border border-gray-100 transition-all ${isDanger
            ? "bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500"
            : "bg-gray-50 text-gray-400 hover:bg-[#0d4b5b] hover:text-white hover:border-[#0d4b5b]"
          }`}
      >
        <Icon className="w-4 h-4 stroke-[2]" />
      </button>
      {tooltip && (
        <span className={`absolute -bottom-6 opacity-0 group-hover/btn:opacity-100 transition-opacity text-[9px] font-bold px-1.5 py-0.5 rounded z-10 ${isDanger ? "text-red-500" : "text-[#0d4b5b]"
          }`}>
          {tooltip}
        </span>
      )}
    </div>
  );
};

// --- Updated BatchModal Component ---
const BatchModal = ({ isEditing, formData, submitting, onClose, onChange, onSubmit }: any) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="absolute inset-0 bg-[#0d4b5b]/40 backdrop-blur-sm"
    />
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
    >
      <div className="px-8 py-6 relative flex justify-center items-center bg-white z-20">
        <h2 className="text-[15px] font-black text-[#0d4b5b] uppercase tracking-widest">
          {isEditing ? "MODIFY BATCH" : "CREATE NEW BATCH"}
        </h2>
        <button onClick={onClose} className="absolute right-6 top-6 p-1 text-gray-900 hover:text-red-500 transition-colors">
          <XMarkIcon className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="px-8 pb-8 space-y-6">
        <InputGroup
          label="Batch Name"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="E.g. 2026 AL Advance"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputGroup
            label="Commencement"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={onChange}
            required
            isDate={true}
          />
          <InputGroup
            label="Conclusion"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={onChange}
            required
            isDate={true}
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-800 mb-2">Internal Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#0d4b5b]/20 rounded-lg px-4 py-3 text-[13px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400"
            rows={4}
            placeholder="Add notes about this batch ..."
          />
        </div>

        <div className="pt-2 flex justify-center">
          <button
            type="submit" disabled={submitting}
            className="bg-[#0d4b5b] hover:bg-[#093946] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-2.5 px-12 rounded-lg transition-all shadow-sm shadow-[#0d4b5b]/20 text-[13px]"
          >
            {submitting ? "Processing..." : isEditing ? "Update Schedule" : "Initialize Batch"}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
);

// --- Updated InputGroup Component ---
const InputGroup = ({ label, isDate, ...props }: any) => (
  <div>
    <label className="block text-[13px] font-bold text-gray-800 mb-2">{label}</label>
    <input
      {...props}
      className={`w-full border focus:ring-2 focus:ring-[#0d4b5b]/20 rounded-lg px-4 py-2.5 text-[13px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 ${isDate ? "bg-[#f4f7f9] border-transparent focus:border-[#0d4b5b]" : "bg-white border-gray-200 focus:border-[#0d4b5b]"
        }`}
    />
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="text-center py-20 mx-4 md:mx-0">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-[15px] font-bold text-gray-900">No Active Batches</h3>
    <p className="text-gray-500 text-xs mt-1.5 max-w-xs mx-auto">Start by creating a batch to organize your academic classes and student groups.</p>
    <button onClick={onAdd} className="mt-6 bg-[#0d4b5b] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#093946] transition-colors shadow-sm">
      Create First Batch
    </button>
  </div>
);