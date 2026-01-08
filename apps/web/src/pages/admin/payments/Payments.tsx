import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import PaymentService, { type PaymentData } from "../../../services/PaymentService";

import {
  BanknotesIcon,
  CreditCardIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  PlusIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Helper to format billing month
const formatBillingMonth = (monthStr?: string) => {
    if (!monthStr) return "N/A";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default function PaymentsPage() {
  const navigate = useNavigate(); 
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PaymentService.getAllPayments(filterStatus);
      setPayments(data);
    } catch (error) {
      console.error("Payment sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleVerify = async (id: string, action: "approve" | "reject") => {
    const original = [...payments];
    const newStatus = action === "approve" ? "completed" : "failed";

    if (!window.confirm(`Are you sure you want to ${action} this transaction?`)) return;

    // Optimistic UI update
    setPayments(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));

    try {
      await PaymentService.verifyPayment(id, action);
    } catch (error) {
      setPayments(original);
      alert("Verification failed. Please check server logs.");
    }
  };

  const getSlipUrl = (path?: string) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return path.startsWith("http") ? path : `${API_BASE}/${cleanPath}`;
  };

  return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">Revenue Operations</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <button
               onClick={() => navigate("/admin/payments/create")}
               className="flex items-center justify-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-brand-cerulean/20 active:scale-95 flex-1 sm:flex-none"
             >
               <PlusIcon className="w-4 h-4 stroke-[3px]" />
               Record Payment
             </button>

             <div className="flex bg-brand-aliceBlue p-1 rounded-xl border border-brand-aliceBlue overflow-x-auto no-scrollbar">
               {['all', 'pending', 'completed', 'failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold rounded-lg capitalize tracking-widest transition-all whitespace-nowrap ${
                      filterStatus === status ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"
                    }`}
                  >
                    {status}
                  </button>
               ))}
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-transparent sm:bg-white sm:border border-brand-aliceBlue rounded-2xl sm:overflow-hidden sm:shadow-sm">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-cerulean" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Syncing Ledgers...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-aliceBlue/30 text-[10px] uppercase text-brand-prussian/40 font-bold tracking-widest border-b border-brand-aliceBlue">
                    <tr>
                      <th className="px-6 py-4">Beneficiary & Module</th>
                      <th className="px-6 py-4">Billing Month</th>
                      <th className="px-6 py-4 text-center">Protocol</th>
                      <th className="px-6 py-4">Timeline</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-aliceBlue/30">
                    <AnimatePresence mode="popLayout">
                      {payments.map((payment) => (
                        <PaymentRow 
                          key={payment._id} 
                          payment={payment} 
                          onViewSlip={(url: string) => setSelectedSlip(url)}
                          onVerify={handleVerify}
                          getSlipUrl={getSlipUrl}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-4">
                  <AnimatePresence mode="popLayout">
                      {payments.map((payment) => (
                          <MobilePaymentCard 
                              key={payment._id}
                              payment={payment}
                              onViewSlip={(url: string) => setSelectedSlip(url)}
                              onVerify={handleVerify}
                              getSlipUrl={getSlipUrl}
                          />
                      ))}
                  </AnimatePresence>
              </div>

              {payments.length === 0 && (
                <div className="py-20 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  No transaction records found
                </div>
              )}
            </>
          )}
        </div>

        {/* Image Viewer Modal */}
        <AnimatePresence>
          {selectedSlip && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-prussian/80 backdrop-blur-md p-4" 
              onClick={() => setSelectedSlip(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-brand-aliceBlue shrink-0">
                  <h3 className="text-xs sm:text-sm font-bold text-brand-prussian uppercase tracking-widest">Verification Document</h3>
                  <button onClick={() => setSelectedSlip(null)} className="p-2 hover:bg-brand-aliceBlue rounded-full transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-4 sm:p-8 bg-brand-aliceBlue/50 flex justify-center items-center overflow-auto flex-1">
                  <img src={selectedSlip} alt="Payment Slip" className="max-w-full rounded-xl shadow-lg border border-brand-aliceBlue" />
                </div>
                <div className="p-4 sm:p-6 bg-white border-t border-brand-aliceBlue flex justify-end shrink-0">
                  <a href={selectedSlip} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-brand-cerulean hover:underline uppercase tracking-widest">
                    Open Original <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

// --- Sub-components ---

function PaymentRow({ payment, onViewSlip, onVerify, getSlipUrl }: any) {
  return (
    <motion.tr layout className="group hover:bg-brand-aliceBlue/10 transition-colors">
      <td className="px-6 py-5">
        <div className="text-sm font-semibold text-brand-prussian leading-none">
          {payment.enrollment?.student?.firstName} {payment.enrollment?.student?.lastName}
        </div>
        <div className="text-[10px] font-bold text-brand-cerulean uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
          <CheckCircleIcon className="w-3 h-3 opacity-50" /> {payment.enrollment?.class?.name}
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-1">LKR {payment.amount.toLocaleString()}</div>
      </td>

      {/* NEW: BILLING MONTH COLUMN */}
      <td className="px-6 py-5">
         <div className="flex items-center gap-2 bg-brand-aliceBlue/50 px-3 py-1.5 rounded-lg w-fit border border-brand-aliceBlue">
             <CalendarDaysIcon className="w-4 h-4 text-brand-cerulean/70" />
             <span className="text-xs font-bold text-brand-prussian">{formatBillingMonth(payment.targetMonth)}</span>
         </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex flex-col items-center gap-1">
          {payment.method === 'payhere' ? (
            <CreditCardIcon className="w-5 h-5 text-brand-cerulean" />
          ) : (
            <BanknotesIcon className="w-5 h-5 text-indigo-400" />
          )}
          <span className="text-[9px] font-black text-gray-400 uppercase">{payment.method}</span>
        </div>
      </td>

      <td className="px-6 py-5 whitespace-nowrap">
        <div className="text-xs font-semibold text-brand-prussian">
          {moment(payment.paymentDate).format("DD MMM, YYYY")}
        </div>
        <div className="text-[10px] text-gray-400 font-medium">
          {moment(payment.paymentDate).format("hh:mm A")}
        </div>
      </td>

      <td className="px-8 py-5">
        <StatusBadge status={payment.status} />
        {payment.method === 'bank_transfer' && payment.rawPayload?.slipUrl && (
          <button 
            onClick={() => onViewSlip(getSlipUrl(payment.rawPayload?.slipUrl))}
            className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-brand-cerulean uppercase tracking-widest hover:text-brand-prussian transition-colors group/btn"
          >
            <DocumentMagnifyingGlassIcon className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" /> Review Proof
          </button>
        )}
      </td>

      <td className="px-6 py-5 text-right">
        {payment.status === 'pending' ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => onVerify(payment._id, 'approve')} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm active:scale-95" title="Verify Payment">
              <CheckCircleIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onVerify(payment._id, 'reject')} className="p-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm active:scale-95" title="Reject Transaction">
              <XCircleIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Locked</span>
        )}
      </td>
    </motion.tr>
  );
}

function MobilePaymentCard({ payment, onViewSlip, onVerify, getSlipUrl }: any) {
    return (
        <motion.div layout className="bg-white p-5 rounded-2xl shadow-sm border border-brand-aliceBlue relative">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-sm font-bold text-brand-prussian">{payment.enrollment?.student?.firstName} {payment.enrollment?.student?.lastName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{payment.enrollment?.class?.name}</p>
                </div>
                <StatusBadge status={payment.status} />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg">
                <span className="font-mono font-bold text-brand-cerulean">LKR {payment.amount.toLocaleString()}</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-brand-prussian">{formatBillingMonth(payment.targetMonth)}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-aliceBlue">
                 <div className="flex items-center gap-2">
                    {payment.method === 'payhere' ? <CreditCardIcon className="w-4 h-4 text-brand-cerulean" /> : <BanknotesIcon className="w-4 h-4 text-indigo-400" />}
                    <span className="text-[10px] font-bold uppercase text-gray-400">{payment.method}</span>
                 </div>

                 {payment.method === 'bank_transfer' && payment.rawPayload?.slipUrl && (
                    <button 
                        onClick={() => onViewSlip(getSlipUrl(payment.rawPayload?.slipUrl))}
                        className="text-[10px] font-bold text-brand-cerulean uppercase flex items-center gap-1"
                    >
                        <DocumentMagnifyingGlassIcon className="w-3.5 h-3.5" /> Proof
                    </button>
                 )}
            </div>

            {payment.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-dashed border-brand-aliceBlue">
                    <button onClick={() => onVerify(payment._id, 'approve')} className="py-2 bg-green-50 text-green-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => onVerify(payment._id, 'reject')} className="py-2 bg-red-50 text-red-500 font-bold text-xs rounded-lg flex items-center justify-center gap-1">
                        <XCircleIcon className="w-4 h-4" /> Reject
                    </button>
                </div>
            )}
        </motion.div>
    );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    completed: { color: "bg-green-50 text-green-600 border-green-100", icon: <CheckCircleIcon className="w-3 h-3" />, label: "Settled" },
    pending: { color: "bg-amber-50 text-amber-600 border-amber-100 animate-pulse", icon: <ClockIcon className="w-3 h-3" />, label: "Pending" },
    failed: { color: "bg-red-50 text-red-600 border-red-100", icon: <XCircleIcon className="w-3 h-3" />, label: "Flagged" },
  };

  const current = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${current.color}`}>
      {current.icon} {current.label}
    </span>
  );
}