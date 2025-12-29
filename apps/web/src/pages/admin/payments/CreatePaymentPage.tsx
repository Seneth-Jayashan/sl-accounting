import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PaymentService from "../../../services/PaymentService";
import EnrollmentService, { type EnrollmentResponse } from "../../../services/EnrollmentService";

import {
  ArrowLeftIcon,
  BanknotesIcon,
  UserIcon,
  HashtagIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon
} from "@heroicons/react/24/outline";

export default function CreatePaymentPage() {
  const navigate = useNavigate();
  
  // --- Form State ---
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // --- Enrollment Search State ---
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Enrollment Object
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentResponse | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    transactionId: "",
    notes: ""
  });

  // 1. Fetch & Filter Enrollments (Unpaid Only)
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoadingEnrollments(true);
      const data = await EnrollmentService.getAllEnrollments(); 
      
      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if ('enrollments' in data) list = data.enrollments || [];

      // SECURITY: Only expose UNPAID or PENDING enrollments
      const unpaidList = list.filter(e => 
        e.paymentStatus === 'unpaid' || e.paymentStatus === 'pending'
      );

      setEnrollments(unpaidList);
      setFilteredEnrollments(unpaidList);
    } catch (err) {
      setError("Unable to load enrollment records.");
    } finally {
      setLoadingEnrollments(false);
    }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  // 2. Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEnrollments(enrollments);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = enrollments.filter(e => {
      const studentName = typeof e.student === 'object' ? `${e.student.firstName} ${e.student.lastName}` : '';
      const className = typeof e.class === 'object' ? e.class.name : '';
      return studentName.toLowerCase().includes(query) || className.toLowerCase().includes(query);
    });
    setFilteredEnrollments(filtered);
  }, [searchQuery, enrollments]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    
    if (typeof enrollment.class === 'object' && enrollment.class !== null) {
        const price = enrollment.class.price ? enrollment.class.price.toString() : "";
        setFormData(prev => ({ ...prev, amount: price }));
    }
    };

  const handleClearSelection = () => {
    setSelectedEnrollment(null);
    setFormData(prev => ({ ...prev, amount: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return setError("Please search and select a student.");
    if (!formData.amount || Number(formData.amount) <= 0) return setError("Valid settlement amount is required.");

    setIsSaving(true);
    setError(null);

    try {
      await PaymentService.createManualPayment({
        enrollment: selectedEnrollment._id,
        amount: Number(formData.amount),
        transactionId: formData.transactionId.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });

      alert("Settlement successful. Access granted.");
      navigate("/admin/payments");
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment processing failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="max-w-3xl mx-auto space-y-6 pb-28 md:pb-24 p-4 lg:p-0">
        
        <header className="space-y-2 pt-2">
          <button onClick={() => navigate(-1)} className="flex items-center text-[10px] md:text-xs font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest group">
            <ArrowLeftIcon className="w-3 h-3 md:w-4 md:h-4 mr-2 stroke-[3px] group-hover:-translate-x-1 transition-transform" /> Back to Ledger
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-brand-prussian tracking-tight">Record Cash Payment</h1>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-brand-aliceBlue shadow-sm space-y-6 md:space-y-8">
            
            {/* --- SMART SEARCHABLE DROPDOWN --- */}
            <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Beneficiary Student <span className="text-red-500">*</span>
                </label>

                {!selectedEnrollment ? (
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text"
                            placeholder={loadingEnrollments ? "Syncing database..." : "Search by Student Name..."}
                            className="w-full pl-12 pr-10 py-3.5 md:py-4 bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                             {loadingEnrollments ? <ArrowPathIcon className="w-4 h-4 animate-spin text-brand-cerulean" /> : <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />}
                        </div>

                        {/* Dropdown Results */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute z-50 w-full mt-2 bg-white border border-brand-aliceBlue rounded-2xl shadow-xl max-h-60 overflow-y-auto"
                                >
                                    {filteredEnrollments.length > 0 ? (
                                        filteredEnrollments.map((enrollment) => {
                                            const studentName = typeof enrollment.student === 'object' ? `${enrollment.student.firstName} ${enrollment.student.lastName}` : 'Unknown';
                                            const className = typeof enrollment.class === 'object' ? enrollment.class?.name : 'Unknown';
                                            
                                            return (
                                                <div 
                                                    key={enrollment._id}
                                                    onClick={() => handleSelectEnrollment(enrollment)}
                                                    className="p-4 hover:bg-brand-aliceBlue/50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                                                >
                                                    <p className="text-sm font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors">{studentName}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <p className="text-xs text-gray-500 truncate max-w-[70%]">{className}</p>
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${enrollment.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                                                            {enrollment.paymentStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 text-center text-xs text-gray-400">
                                            {searchQuery ? "No matching unpaid enrollments found." : "Start typing to search..."}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    // SELECTED STATE
                    <div className="flex items-center justify-between p-4 bg-brand-cerulean/5 border border-brand-cerulean/20 rounded-xl">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-brand-prussian truncate">
                                {typeof selectedEnrollment.student === 'object' ? `${selectedEnrollment.student.firstName} ${selectedEnrollment.student.lastName}` : 'Student'}
                            </p>
                            <p className="text-xs text-brand-cerulean mt-0.5 font-medium truncate">
                                {typeof selectedEnrollment.class === 'object' ? selectedEnrollment.class?.name : 'Class'}
                            </p>
                        </div>
                        <button onClick={handleClearSelection} className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-red-500 transition-all shrink-0">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BanknotesIcon className="w-3 h-3" /> Settlement Amount (LKR)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3.5 text-sm font-medium focus:border-brand-cerulean outline-none transition-all placeholder:text-gray-300"
                  required
                  min="1"
                />
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <HashtagIcon className="w-3 h-3" /> Reference ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RCPT-001"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                  className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3.5 text-sm font-medium focus:border-brand-cerulean outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <DocumentTextIcon className="w-3 h-3" /> Audit Notes
              </label>
              <textarea
                rows={3}
                placeholder="Reason for manual entry..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3.5 text-sm font-medium focus:border-brand-cerulean outline-none transition-all resize-none placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Sticky Mobile Actions */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 lg:static lg:bg-transparent lg:border-none lg:p-0 z-50 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSaving || !selectedEnrollment}
              className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <><CheckCircleIcon className="w-5 h-5" /> Confirm & Activate</>}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full bg-white border border-brand-aliceBlue text-gray-400 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-all hidden md:block"
            >
              Cancel Entry
            </button>
          </div>
        </form>
      </div>
  );
}