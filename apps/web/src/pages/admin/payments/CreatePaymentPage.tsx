import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import PaymentService from "../../../services/PaymentService";
import EnrollmentService, {
  type EnrollmentResponse,
} from "../../../services/EnrollmentService";

import {
  ArrowLeftIcon,
  BanknotesIcon,
  UserIcon,
  HashtagIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export default function CreatePaymentPage() {
  const navigate = useNavigate();

  // --- Form State ---
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Enrollment Search State ---
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<
    EnrollmentResponse[]
  >([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Enrollment Object
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<EnrollmentResponse | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    transactionId: "",
    notes: "",
  });

  // 1. Fetch & Filter Enrollments (Unpaid / Pending Only)
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoadingEnrollments(true);
      const data = await EnrollmentService.getAllEnrollments();

      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if ("enrollments" in data) list = data.enrollments || [];

      const unpaidList = list.filter(
        (e) => e.paymentStatus === "unpaid" || e.paymentStatus === "pending"
      );

      setEnrollments(unpaidList);
      setFilteredEnrollments(unpaidList);
    } catch {
      setError("Unable to load enrollment records.");
    } finally {
      setLoadingEnrollments(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // 2. Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEnrollments(enrollments);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = enrollments.filter((e) => {
      const studentName =
        typeof e.student === "object"
          ? `${e.student.firstName} ${e.student.lastName}`
          : "";
      const className = typeof e.class === "object" ? e.class?.name || "" : "";
      return (
        studentName.toLowerCase().includes(query) ||
        className.toLowerCase().includes(query)
      );
    });
    setFilteredEnrollments(filtered);
  }, [searchQuery, enrollments]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Handlers
  const handleSelectEnrollment = (enrollment: EnrollmentResponse) => {
    setSelectedEnrollment(enrollment);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setError(null);
    setFormData((prev) => ({ ...prev, amount: "" }));
  };

  const handleClearSelection = () => {
    setSelectedEnrollment(null);
    setFormData((prev) => ({ ...prev, amount: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) {
      return setError("Please search and select a student.");
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      return setError("A valid settlement amount is required.");
    }

    setIsSaving(true);
    setError(null);

    try {
      await PaymentService.createManualPayment({
        enrollment: selectedEnrollment._id,
        amount: Number(formData.amount),
        transactionId: formData.transactionId.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.success("Settlement recorded. Student access activated.");
      navigate("/admin/payments");
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment processing failed.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for selected class fee (if available on populated class object)
  const suggestedClassFee =
    selectedEnrollment &&
      typeof selectedEnrollment.class === "object" &&
      (selectedEnrollment.class as any)?.price
      ? Number((selectedEnrollment.class as any).price)
      : null;

  const selectedStudentName =
    selectedEnrollment && typeof selectedEnrollment.student === "object"
      ? `${selectedEnrollment.student.firstName} ${selectedEnrollment.student.lastName}`
      : "Student";

  const selectedStudentInitials =
    selectedEnrollment && typeof selectedEnrollment.student === "object"
      ? `${selectedEnrollment.student.firstName?.[0] || "S"}${selectedEnrollment.student.lastName?.[0] || ""
        }`.toUpperCase()
      : "ST";

  const selectedClassName =
    selectedEnrollment && typeof selectedEnrollment.class === "object"
      ? selectedEnrollment.class?.name || "Class"
      : "Class";

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-16">
      {/* HEADER */}
      <header className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Ledger
        </button>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Record Cash Payment
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manually settle an unpaid or pending enrollment and grant immediate class access.
          </p>
        </div>
      </header>

      {/* ERROR BANNER */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-rose-50 border border-rose-200/80 text-rose-700 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-500"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. BENEFICIARY STUDENT */}
        <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-prussian">
                Beneficiary Student
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Search unpaid or pending enrollments by student or class name.
              </p>
            </div>
          </div>

          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Enrollment <span className="text-rose-500">*</span>
            </label>

            {!selectedEnrollment ? (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    loadingEnrollments
                      ? "Loading unpaid enrollments..."
                      : "Search by student name or class..."
                  }
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {loadingEnrollments ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-brand-cerulean" />
                  ) : (
                    <ChevronUpDownIcon className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Dropdown Results */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100"
                    >
                      {filteredEnrollments.length > 0 ? (
                        filteredEnrollments.map((enrollment) => {
                          const sName =
                            typeof enrollment.student === "object"
                              ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
                              : "Unknown Student";
                          const sInitials =
                            typeof enrollment.student === "object"
                              ? `${enrollment.student.firstName?.[0] || "S"}${enrollment.student.lastName?.[0] || ""
                                }`.toUpperCase()
                              : "ST";
                          const cName =
                            typeof enrollment.class === "object"
                              ? enrollment.class?.name
                              : "Unknown Class";
                          const isPending = enrollment.paymentStatus === "pending";

                          return (
                            <button
                              type="button"
                              key={enrollment._id}
                              onClick={() => handleSelectEnrollment(enrollment)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-xs shrink-0">
                                  {sInitials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-brand-prussian group-hover:text-brand-cerulean transition-colors truncate">
                                    {sName}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {cName}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 shrink-0 ${isPending
                                    ? "bg-amber-50 text-amber-700 ring-amber-600/15"
                                    : "bg-rose-50 text-rose-700 ring-rose-600/15"
                                  }`}
                              >
                                {enrollment.paymentStatus}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400">
                          {loadingEnrollments
                            ? "Loading records..."
                            : searchQuery
                              ? "No matching unpaid enrollments found."
                              : "No unpaid or pending enrollments available."}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Selected Student Card */
              <div className="flex items-center justify-between gap-4 p-4 bg-brand-aliceBlue/50 border border-brand-cerulean/25 rounded-xl">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-prussian text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedStudentInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-brand-prussian truncate">
                      {selectedStudentName}
                    </p>
                    <p className="text-xs text-brand-cerulean font-medium truncate flex items-center gap-1.5 mt-0.5">
                      <AcademicCapIcon className="w-3.5 h-3.5 shrink-0" />
                      {selectedClassName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-colors shrink-0"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 2. SETTLEMENT DETAILS */}
        <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
              <BanknotesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-prussian">
                Settlement Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter the cash amount received and optional receipt reference.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Settlement Amount <span className="text-rose-500">*</span>
                </label>
                {suggestedClassFee && suggestedClassFee > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: String(suggestedClassFee),
                      }))
                    }
                    className="text-[11px] font-semibold text-brand-cerulean hover:underline tabular-nums"
                  >
                    Use class fee (LKR {suggestedClassFee.toLocaleString()})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  LKR
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-bold text-brand-prussian tabular-nums placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Reference ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reference ID{" "}
                <span className="text-slate-400 font-normal normal-case">
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <HashtagIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g., RCPT-001"
                  value={formData.transactionId}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionId: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Audit Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Audit Notes{" "}
              <span className="text-slate-400 font-normal normal-case">
                (Optional)
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="Add reason for manual entry, receipt book number, or special discount notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all resize-none"
            />
          </div>
        </section>

        {/* ACTION BAR */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex items-center justify-end gap-3 z-40 md:z-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
            className="hidden md:inline-flex px-6 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !selectedEnrollment}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>Confirm & Activate</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}