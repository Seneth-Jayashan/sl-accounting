import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import moment from "moment";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import BatchService from "../../../services/BatchService";
import type { BatchData, BatchPayload } from "../../../services/BatchService";

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon // Added EyeIcon
} from "@heroicons/react/24/outline";

// --- Initial Form State ---
const initialFormState = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function BatchPage() {
  const navigate = useNavigate(); // Initialize Hook

  // --- Data State ---
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Batches
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await BatchService.getAllBatches(false); // Fetch all (active & inactive)
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error("Failed to load batches", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // 2. Handle Form Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Open Modal (Add)
  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setCurrentId(null);
    setIsModalOpen(true);
  };

  // 4. Open Modal (Edit)
  const openEditModal = (batch: BatchData) => {
    setFormData({
      name: batch.name,
      description: batch.description || "",
      startDate: moment(batch.startDate).format("YYYY-MM-DD"),
      endDate: moment(batch.endDate).format("YYYY-MM-DD"),
      isActive: batch.isActive,
    });
    setCurrentId(batch._id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // 5. Submit Form (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: BatchPayload = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      if (isEditing && currentId) {
        await BatchService.updateBatch(currentId, payload);
        alert("Batch updated successfully!");
      } else {
        await BatchService.createBatch(payload);
        alert("Batch created successfully!");
      }

      setIsModalOpen(false);
      fetchBatches(); // Refresh list
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Delete Batch
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await BatchService.deleteBatch(id);
      setBatches((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete batch.");
    }
  };

  // 7. Toggle Status
  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await BatchService.toggleStatus(id);
      // Optimistic update
      setBatches((prev) => 
        prev.map((b) => (b._id === id ? { ...b, isActive: !currentStatus } : b))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
            <p className="text-gray-500 text-sm">Create and manage student batches (intakes).</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#0b2540] hover:bg-[#153454] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Batch
          </button>
        </div>

        {/* Content */}
        {loading ? (
           <div className="flex justify-center py-20 animate-pulse text-gray-400">Loading batches...</div>
        ) : batches.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <h3 className="text-lg font-medium text-gray-900">No Batches Found</h3>
             <p className="text-gray-500 mb-4">Get started by creating your first student batch.</p>
             <button onClick={openAddModal} className="text-[#0b2540] font-medium hover:underline">Create Batch</button>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {/* Desktop Table */}
             <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="px-6 py-4">Batch Name</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {batches.map((batch) => (
                      <tr key={batch._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {/* Navigation Link on Name */}
                          <div 
                            onClick={() => navigate(`/admin/batches/view/${batch._id}`)}
                            className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {batch.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{batch.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                             <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{moment(batch.startDate).format("MMM YYYY")}</span>
                             <span className="text-gray-400">→</span>
                             <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{moment(batch.endDate).format("MMM YYYY")}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggle(batch._id, batch.isActive)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              batch.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {batch.isActive ? <CheckCircleIcon className="w-3 h-3"/> : <XCircleIcon className="w-3 h-3"/>}
                            {batch.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {/* View Button */}
                             <button 
                               onClick={() => navigate(`/admin/batches/view/${batch._id}`)}
                               className="p-2 text-gray-500 hover:text-[#0b2540] hover:bg-blue-50 rounded-lg transition-colors"
                               title="View Details"
                             >
                               <EyeIcon className="w-5 h-5" />
                             </button>

                             <button 
                               onClick={() => openEditModal(batch)}
                               className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                               title="Edit"
                             >
                               <PencilSquareIcon className="w-5 h-5" />
                             </button>
                             <button 
                               onClick={() => handleDelete(batch._id)}
                               className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                               title="Delete"
                             >
                               <TrashIcon className="w-5 h-5" />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             {/* Mobile Cards */}
             <div className="md:hidden space-y-4">
                {batches.map((batch) => (
                  <div key={batch._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                        <div onClick={() => navigate(`/admin/batches/view/${batch._id}`)}>
                           <h3 className="font-bold text-gray-900 cursor-pointer hover:text-blue-600">{batch.name}</h3>
                           <p className="text-xs text-gray-500">{batch.description}</p>
                        </div>
                        <button 
                            onClick={() => handleToggle(batch._id, batch.isActive)}
                            className={`px-2 py-1 rounded text-xs font-bold ${batch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            {batch.isActive ? "Active" : "Inactive"}
                        </button>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400"/>
                        <span>{moment(batch.startDate).format("MMM 'YY")} - {moment(batch.endDate).format("MMM 'YY")}</span>
                     </div>
                     <div className="flex gap-2">
                        {/* Mobile View Button */}
                        <button 
                          onClick={() => navigate(`/admin/batches/view/${batch._id}`)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-700"
                        >
                          <EyeIcon className="w-4 h-4"/> View
                        </button>
                        <button 
                          onClick={() => openEditModal(batch)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                        >
                          <PencilSquareIcon className="w-4 h-4"/> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(batch._id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 border border-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4"/> Delete
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* --- Create / Edit Modal --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                   <h2 className="text-xl font-bold text-gray-900">
                     {isEditing ? "Edit Batch" : "Create New Batch"}
                   </h2>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                     <XMarkIcon className="w-5 h-5" />
                   </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. 2024 Intake A"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0b2540] transition-all"
                        required
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0b2540]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input 
                          type="date" 
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0b2540]"
                          required
                        />
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Brief details about this batch..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0b2540]"
                      />
                   </div>

                   <button 
                     type="submit"
                     disabled={submitting}
                     className="w-full bg-[#0b2540] hover:bg-[#153454] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/10 mt-2"
                   >
                     {submitting ? "Saving..." : (isEditing ? "Update Batch" : "Create Batch")}
                   </button>
                </form>
             </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}