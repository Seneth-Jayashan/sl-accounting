import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import BatchService, {
  type BatchData,
  type BatchPayload,
} from "../../../services/BatchService";

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CalendarDaysIcon,
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
  CheckCircleIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

// --- Skeleton Loader ---

function BatchSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-64 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function BatchPage() {
  const navigate = useNavigate();

  // Data & Loading State
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<BatchData | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // --- Derived Stats & Filtered List ---
  const stats = useMemo(() => {
    const active = batches.filter((b) => b.isActive).length;
    return {
      total: batches.length,
      active,
      hidden: batches.length - active,
    };
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return batches.filter((b) => {
      if (statusFilter === "active" && !b.isActive) return false;
      if (statusFilter === "hidden" && b.isActive) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.description || "").toLowerCase().includes(q)
      );
    });
  }, [batches, searchQuery, statusFilter]);

  // --- Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const openModal = (batch?: BatchData) => {
    setFormError(null);
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

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setFormError("End date must be after the start date.");
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
      setFormError(error.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await BatchService.deleteBatch(deleteTarget._id);
      setBatches((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      alert("Failed to delete batch.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const originalBatches = [...batches];
    setBatches((prev) =>
      prev.map((b) => (b._id === id ? { ...b, isActive: !currentStatus } : b))
    );

    try {
      await BatchService.toggleStatus(id);
    } catch {
      alert("Failed to update status. Reverting changes.");
      setBatches(originalBatches);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Batch Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize academic years, enrollment schedules, and student cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchBatches}
            disabled={loading}
            title="Refresh batches"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {/* LOADING SKELETON */}
      {loading && batches.length === 0 ? (
        <BatchSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Batches
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <RectangleStackIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.active}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Hidden
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.hidden}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <EyeSlashIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* DIRECTORY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batches by name or description..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 self-start lg:self-auto">
                {(
                  [
                    { key: "all", label: "All", count: stats.total },
                    { key: "active", label: "Active", count: stats.active },
                    { key: "hidden", label: "Hidden", count: stats.hidden },
                  ] as const
                ).map((tab) => {
                  const active = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                          ? "bg-white text-brand-prussian shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                            ? "bg-brand-aliceBlue text-brand-cerulean"
                            : "bg-slate-200/70 text-slate-500"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            {filteredBatches.length === 0 ? (
              <EmptyState
                isEmptyList={batches.length === 0}
                onAdd={() => openModal()}
              />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Batch</th>
                        <th className="px-6 py-3.5">Academic Period</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBatches.map((batch) => (
                        <BatchRow
                          key={batch._id}
                          batch={batch}
                          onEdit={() => openModal(batch)}
                          onDelete={() => setDeleteTarget(batch)}
                          onToggle={() => handleToggleStatus(batch._id, batch.isActive)}
                          onView={() => navigate(`/admin/batches/view/${batch._id}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredBatches.map((batch) => (
                    <MobileBatchCard
                      key={batch._id}
                      batch={batch}
                      onView={() => navigate(`/admin/batches/view/${batch._id}`)}
                      onEdit={() => openModal(batch)}
                      onDelete={() => setDeleteTarget(batch)}
                      onToggle={() => handleToggleStatus(batch._id, batch.isActive)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <BatchModal
            isEditing={isEditing}
            formData={formData}
            formError={formError}
            submitting={submitting}
            onClose={closeModal}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Delete batch?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-brand-prussian">
                    "{deleteTarget.name}"
                  </strong>
                  ? This may affect linked classes and student enrollments.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete Batch"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

interface BatchItemProps {
  batch: BatchData;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onView: () => void;
}

const BatchRow = ({ batch, onEdit, onDelete, onToggle, onView }: BatchItemProps) => {
  const durationMonths = Math.max(
    1,
    moment(batch.endDate).diff(moment(batch.startDate), "months")
  );

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
            <CalendarDaysIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <button
              onClick={onView}
              className="font-semibold text-sm text-brand-prussian hover:text-brand-cerulean transition-colors text-left truncate block"
            >
              {batch.name}
            </button>
            <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
              {batch.description || "No description provided"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-brand-prussian tabular-nums">
          {moment(batch.startDate).format("DD MMM YYYY")} —{" "}
          {moment(batch.endDate).format("DD MMM YYYY")}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          ~{durationMonths} {durationMonths === 1 ? "month" : "months"} duration
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge active={batch.isActive} onClick={onToggle} />
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={onView}
            title="View batch"
            className="p-2 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            title="Edit batch"
            className="p-2 rounded-lg text-slate-400 hover:text-brand-prussian hover:bg-slate-100 transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete batch"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const MobileBatchCard = ({
  batch,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: BatchItemProps) => (
  <div className="p-4 bg-white space-y-3.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-semibold text-brand-prussian text-sm truncate">
          {batch.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
          {moment(batch.startDate).format("DD MMM YYYY")} —{" "}
          {moment(batch.endDate).format("DD MMM YYYY")}
        </p>
      </div>
      <StatusBadge active={batch.isActive} onClick={onToggle} />
    </div>

    {batch.description && (
      <p className="text-xs text-slate-500 line-clamp-2">{batch.description}</p>
    )}

    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
      <button
        onClick={onView}
        className="py-2 bg-slate-50 hover:bg-brand-aliceBlue text-brand-prussian font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
      >
        <EyeIcon className="w-3.5 h-3.5" /> View
      </button>
      <button
        onClick={onEdit}
        className="py-2 bg-slate-50 hover:bg-brand-aliceBlue text-brand-prussian font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
      >
        <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
      </button>
      <button
        onClick={onDelete}
        className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
      >
        <TrashIcon className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  </div>
);

interface BatchModalProps {
  isEditing: boolean;
  formData: typeof INITIAL_FORM_STATE;
  formError: string | null;
  submitting: boolean;
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const BatchModal = ({
  isEditing,
  formData,
  formError,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: BatchModalProps) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
    />
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 12 }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200/70 w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-brand-prussian">
            {isEditing ? "Edit Batch" : "Create New Batch"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define the cohort name and academic schedule.
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={submitting}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form
        id="batch-form"
        onSubmit={onSubmit}
        className="p-6 space-y-5 overflow-y-auto flex-1"
      >
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {formError}
          </div>
        )}

        <InputGroup
          label="Batch Name"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="e.g., 2026 A/L Accounting"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={onChange}
            required
          />
          <InputGroup
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={onChange}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Description <span className="text-slate-400 font-normal normal-case">(Optional)</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 rounded-xl p-3.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none transition-all"
            rows={3}
            placeholder="Add notes about this batch..."
          />
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="batch-form"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-brand-prussian hover:bg-brand-cerulean text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {submitting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
          <span>
            {submitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Batch"}
          </span>
        </button>
      </div>
    </motion.div>
  </div>
);

const StatusBadge = ({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    title="Click to toggle visibility"
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 transition-all ${active
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 hover:bg-emerald-100"
        : "bg-slate-100 text-slate-600 ring-slate-300/70 hover:bg-slate-200"
      }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"
        }`}
    />
    {active ? "Active" : "Hidden"}
  </button>
);

const InputGroup = ({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      required={required}
      {...props}
      className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 rounded-xl px-4 py-2.5 text-sm font-medium text-brand-prussian placeholder:text-slate-400 outline-none transition-all"
    />
  </div>
);

const EmptyState = ({
  isEmptyList,
  onAdd,
}: {
  isEmptyList: boolean;
  onAdd: () => void;
}) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
      <CalendarDaysIcon className="w-7 h-7 text-slate-300" />
    </div>
    <h3 className="text-sm font-semibold text-brand-prussian">
      {isEmptyList ? "No batches created yet" : "No matching batches"}
    </h3>
    <p className="text-xs text-slate-400 mt-1 max-w-xs">
      {isEmptyList
        ? "Start by creating a batch to organize your academic classes and student groups."
        : "Try adjusting your search query or status filter."}
    </p>
    {isEmptyList && (
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Create First Batch
      </button>
    )}
  </div>
);