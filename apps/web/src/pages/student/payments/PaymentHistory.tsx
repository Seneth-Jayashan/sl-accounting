import { useEffect, useState } from "react";
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
  Printer
} from "lucide-react";

// Components
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";

// Service & Types
import PaymentService, {type  PaymentData } from "../../../services/PaymentService";

// --- CONFIG ---
// Safe image URL generator
const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/${cleanPath}`;
};

export default function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [viewSlip, setViewSlip] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<PaymentData | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await PaymentService.getMyPayments();
        setPayments(data);
      } catch (error) {
        console.error("Failed to load payments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // --- RENDER HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100"><CheckCircle2 size={12} /> Paid</span>;
      case "pending":
        return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs font-bold border border-yellow-100"><Clock size={12} /> Pending</span>;
      default:
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-100"><AlertCircle size={12} /> Failed</span>;
    }
  };

  const getMethodIcon = (method: string) => {
    if (method === "payhere") return <CreditCard size={16} className="text-blue-600" />;
    return <Building2 size={16} className="text-purple-600" />;
  };

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50 pb-24 font-sans">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#0b2540] font-sinhala">Payment History</h1>
          <p className="text-gray-500 mt-2">View your past transactions and download receipts.</p>
        </div>

        {/* Content */}
        {loading ? (
           <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse shadow-sm"></div>)}
           </div>
        ) : payments.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                 <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Payments Yet</h3>
              <p className="text-gray-500 text-sm">Your transaction history will appear here.</p>
           </div>
        ) : (
           <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
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
                           {moment(payment.paymentDate).format("MMM DD, YYYY")}
                           <div className="text-[10px] text-gray-400">{moment(payment.paymentDate).format("h:mm A")}</div>
                        </td>
                        <td className="p-6">
                           <div className="font-bold text-[#0b2540]">{payment.enrollment?.class?.name || "Unknown Class"}</div>
                           <div className="text-xs text-gray-400">ID: {payment._id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td className="p-6 font-mono font-bold text-gray-900">
                           {PaymentService.formatCurrency(payment.amount)}
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2 text-sm capitalize text-gray-700">
                              {getMethodIcon(payment.method)}
                              {payment.method.replace('_', ' ')}
                           </div>
                        </td>
                        <td className="p-6">
                           {getStatusBadge(payment.status)}
                        </td>
                        <td className="p-6 text-right">
                           {/* Action Buttons Logic */}
                           {payment.method === "payhere" && payment.status === "completed" ? (
                              <button 
                                onClick={() => setViewReceipt(payment)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                 <FileText size={14} /> Receipt
                              </button>
                           ) : payment.method === "bank_transfer" && payment.rawPayload?.slipUrl ? (
                              <button 
                                onClick={() => setViewSlip(getImageUrl(payment.rawPayload?.slipUrl) || "")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                              >
                                 <Eye size={14} /> View Slip
                              </button>
                           ) : (
                              <span className="text-gray-300 text-xs italic">No Action</span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {/* --- MODAL 1: VIEW SLIP --- */}
        {viewSlip && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewSlip(null)}>
              <div className="relative bg-transparent max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                 <button onClick={() => setViewSlip(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300">
                    <X size={32} />
                 </button>
                 <img src={viewSlip} alt="Bank Slip" className="w-full h-auto rounded-xl shadow-2xl border border-white/20" />
              </div>
           </div>
        )}

        {/* --- MODAL 2: OFFICIAL RECEIPT --- */}
        {viewReceipt && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                 
                 {/* Receipt Header */}
                 <div className="bg-[#0b2540] p-6 text-white flex justify-between items-start">
                    <div>
                       <h2 className="text-xl font-bold">Payment Receipt</h2>
                       <p className="text-blue-200 text-xs mt-1">SL Accounting Institute</p>
                    </div>
                    <button onClick={() => setViewReceipt(null)} className="text-white/70 hover:text-white">
                       <X size={24} />
                    </button>
                 </div>

                 {/* Receipt Body (Scrollable) */}
                 <div className="p-8 space-y-6 overflow-y-auto" id="printable-receipt">
                    <div className="text-center border-b border-gray-100 pb-6">
                       <div className="text-4xl font-bold text-[#0b2540] mb-2">
                          {PaymentService.formatCurrency(viewReceipt.amount)}
                       </div>
                       <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          Paid Successfully
                       </span>
                    </div>

                    <div className="space-y-4 text-sm">
                       <div className="flex justify-between">
                          <span className="text-gray-500">Transaction ID</span>
                          <span className="font-mono font-bold text-gray-900">{viewReceipt.payhere_payment_id || "N/A"}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="font-medium text-gray-900">{moment(viewReceipt.paymentDate).format("MMM DD, YYYY - h:mm A")}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-500">Payment Method</span>
                          <span className="font-medium text-gray-900 capitalize">Online (PayHere)</span>
                       </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Details</p>
                       <div className="flex justify-between items-center">
                          <div>
                             <p className="font-bold text-gray-900 text-sm">{viewReceipt.enrollment?.class?.name}</p>
                             <p className="text-xs text-gray-500">Monthly Subscription</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Receipt Footer (Actions) */}
                 <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                       onClick={() => window.print()}
                       className="flex-1 bg-[#0b2540] text-white py-3 rounded-xl font-bold hover:bg-[#153454] transition-colors flex items-center justify-center gap-2"
                    >
                       <Printer size={18} /> Print Receipt
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </DashboardLayout>
  );
}