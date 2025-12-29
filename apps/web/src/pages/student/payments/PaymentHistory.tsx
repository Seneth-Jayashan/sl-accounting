import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { 
  Eye, 
  FileText, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  X,
  Calendar,
  ArrowRight
} from "lucide-react";

import PaymentService, { type PaymentData } from "../../../services/PaymentService";

// --- CONFIG ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
};

export default function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [viewSlip, setViewSlip] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<PaymentData | null>(null);

  // Printing Ref
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await PaymentService.getMyPayments();
        if (isMounted) setPayments(data);
      } catch (error) {
        console.error("Failed to load payments", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, []);


  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-green-200 uppercase tracking-wide"><CheckCircle2 size={12} /> Paid</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-yellow-200 uppercase tracking-wide"><Clock size={12} /> Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-red-200 uppercase tracking-wide"><AlertCircle size={12} /> Failed</span>;
    }
  };

  const getMethodIcon = (method: string) => {
    if (method === "payhere") return <CreditCard size={16} className="text-blue-600" />;
    return <Building2 size={16} className="text-purple-600" />;
  };

  return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50 pb-24 font-sans">
        
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b2540]">Payment History</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">View your past transactions and download receipts.</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
           <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse shadow-sm border border-gray-100"></div>)}
           </div>
        ) : payments.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center"
           >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                 <FileText size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Payments Yet</h3>
              <p className="text-gray-400 text-sm max-w-xs mt-1">Your transaction history will appear here once you enroll in a class.</p>
           </motion.div>
        ) : (
           <>
              {/* --- DESKTOP VIEW (Table) --- */}
              <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                         <th className="p-6 font-bold">Date</th>
                         <th className="p-6 font-bold">Class / Batch</th>
                         <th className="p-6 font-bold">Amount</th>
                         <th className="p-6 font-bold">Method</th>
                         <th className="p-6 font-bold">Status</th>
                         <th className="p-6 font-bold text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {payments.map((payment) => (
                         <tr key={payment._id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="p-6 text-sm text-gray-600 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">{moment(payment.paymentDate).format("MMM DD, YYYY")}</div>
                                    <div className="text-[10px] text-gray-400">{moment(payment.paymentDate).format("h:mm A")}</div>
                                </div>
                              </div>
                           </td>
                           <td className="p-6">
                              <div className="font-bold text-[#0b2540]">{payment.enrollment?.class?.name || "Unknown Class"}</div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">#{payment._id.slice(-6).toUpperCase()}</div>
                           </td>
                           <td className="p-6 font-mono font-bold text-gray-900">
                              {PaymentService.formatCurrency(payment.amount)}
                           </td>
                           <td className="p-6">
                              <div className="flex items-center gap-2 text-sm capitalize text-gray-700 font-medium">
                                {getMethodIcon(payment.method)}
                                {payment.method === 'bank_transfer' ? 'Bank Slip' : 'Online'}
                              </div>
                           </td>
                           <td className="p-6">
                              {getStatusBadge(payment.status)}
                           </td>
                           <td className="p-6 text-right">
                              {payment.method === "payhere" && payment.status === "completed" ? (
                                 <button 
                                   onClick={() => setViewReceipt(payment)}
                                   className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                 >
                                    <FileText size={14} /> Receipt
                                 </button>
                              ) : payment.method === "bank_transfer" && payment.rawPayload?.slipUrl ? (
                                 <button 
                                   onClick={() => setViewSlip(getImageUrl(payment.rawPayload?.slipUrl) || "")}
                                   className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                                 >
                                    <Eye size={14} /> View Slip
                                 </button>
                              ) : (
                                 <span className="text-gray-300 text-xs italic">--</span>
                              )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>

              {/* --- MOBILE VIEW (Cards) --- */}
              <div className="md:hidden space-y-4">
                {payments.map((payment) => (
                    <div key={payment._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        {/* Status Line */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">{moment(payment.paymentDate).format("MMM DD, YYYY")}</p>
                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{payment.enrollment?.class?.name}</h3>
                            </div>
                            <div>{getStatusBadge(payment.status)}</div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Amount</p>
                                <p className="font-mono font-bold text-gray-800">{PaymentService.formatCurrency(payment.amount)}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Method</p>
                                <div className="flex items-center gap-1.5 font-medium text-sm mt-0.5 capitalize">
                                    {getMethodIcon(payment.method)}
                                    <span className="text-xs">{payment.method === 'bank_transfer' ? 'Slip' : 'Card'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                             {payment.method === "payhere" && payment.status === "completed" ? (
                                 <button 
                                   onClick={() => setViewReceipt(payment)}
                                   className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                                 >
                                    <FileText size={16} /> Receipt
                                 </button>
                              ) : payment.method === "bank_transfer" && payment.rawPayload?.slipUrl ? (
                                 <button 
                                   onClick={() => setViewSlip(getImageUrl(payment.rawPayload?.slipUrl) || "")}
                                   className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                                 >
                                    <Eye size={16} /> View Slip
                                 </button>
                              ) : (
                                <button disabled className="flex-1 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed">
                                    No Actions
                                </button>
                              )}
                        </div>
                    </div>
                ))}
              </div>
           </>
        )}

        {/* --- MODAL 1: VIEW SLIP --- */}
        <AnimatePresence>
            {viewSlip && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" 
                    onClick={() => setViewSlip(null)}
                >
                    <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewSlip(null)} className="absolute -top-12 right-0 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                            <X size={24} />
                        </button>
                        <img src={viewSlip} alt="Bank Slip" className="w-full h-auto rounded-xl shadow-2xl border border-white/10" />
                        <div className="mt-4 text-center">
                            <a 
                                href={viewSlip} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm"
                            >
                                Open Original <ArrowRight size={14} />
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- MODAL 2: OFFICIAL RECEIPT --- */}
        <AnimatePresence>
            {viewReceipt && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                         {/* Header */}
                         <div className="bg-[#0b2540] p-5 text-white flex justify-between items-start shrink-0">
                            <div>
                               <h2 className="text-xl font-bold">Payment Receipt</h2>
                               <p className="text-blue-200 text-xs mt-1 opacity-80">Official Transaction Record</p>
                            </div>
                            <button onClick={() => setViewReceipt(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                               <X size={20} />
                            </button>
                         </div>

                         {/* Printable Content Area */}
                         <div className="flex-1 overflow-y-auto bg-white p-6" ref={receiptRef}>
                            <div className="border border-gray-100 rounded-2xl p-6">
                                <div className="text-center border-b border-gray-100 pb-6 mb-6">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="text-3xl font-black text-[#0b2540] mb-1">
                                    {PaymentService.formatCurrency(viewReceipt.amount)}
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Payment Successful</p>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                        <span className="text-gray-500 text-xs">Transaction ID</span>
                                        <span className="font-mono font-bold text-gray-900 text-xs">{viewReceipt.payhere_payment_id || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                        <span className="text-gray-500 text-xs">Date & Time</span>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{moment(viewReceipt.paymentDate).format("MMM DD, YYYY")}</p>
                                            <p className="text-[10px] text-gray-400">{moment(viewReceipt.paymentDate).format("h:mm A")}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                        <span className="text-gray-500 text-xs">Payment Method</span>
                                        <span className="font-bold text-gray-900 flex items-center gap-1">
                                            <CreditCard size={12}/> Online Card
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl mt-6">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Class Details</p>
                                    <p className="font-bold text-gray-900 text-sm">{viewReceipt.enrollment?.class?.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Monthly Subscription</p>
                                </div>
                                
                                <div className="mt-8 text-center">
                                    <p className="text-[10px] text-gray-300">Thank you for learning with us.</p>
                                </div>
                            </div>
                         </div>

                        
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
  );
}