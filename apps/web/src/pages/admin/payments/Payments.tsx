import { useEffect, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import PaymentService from "../../../services/PaymentService";
import type { PaymentData } from "../../../services/PaymentService";

import moment from "moment";
import {
  BanknotesIcon,
  CreditCardIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// Helper for Image URLs (from backend 'uploads' folder)
const API_BASE = "http://localhost:3000"; // Or import.meta.env.VITE_API_URL root

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null); // For Image Modal

  // --- Fetch Data ---
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await PaymentService.getAllPayments(filterStatus);
      setPayments(data);
    } catch (error) {
      console.error("Failed to load payments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  // --- Handlers ---
  const handleVerify = async (id: string, action: "approve" | "reject") => {
    const confirmMsg = action === "approve" 
      ? "Approve this payment? This will grant the student access." 
      : "Reject this payment?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await PaymentService.verifyPayment(id, action);
      // Optimistic Update
      setPayments(prev => prev.map(p => 
        p._id === id ? { ...p, status: action === "approve" ? "completed" : "failed" } : p
      ));
    } catch (error) {
      alert("Action failed.");
    }
  };

  const getSlipUrl = (path?: string) => {
    if (!path) return null;
    // Ensure path doesn't double slash if stored as /uploads/...
    return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  console.log("Payments Render:", payments);

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-500 text-sm">Verify bank slips and track revenue.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
             {['all', 'pending', 'completed', 'failed'].map(status => (
                 <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                        filterStatus === status 
                        ? "bg-white text-[#0b2540] shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                 >
                    {status}
                 </button>
             ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
                <div className="p-10 text-center text-gray-400 animate-pulse">Loading payments...</div>
            ) : payments.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No payments found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Student / Class</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                                    
                                    {/* Student & Class Info */}
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {payment.enrollment?.student?.firstName || "Unknown"} {payment.enrollment?.student?.lastName}
                                        </div>
                                        <div className="text-xs text-[#0b2540] font-semibold mt-0.5">
                                            {payment.enrollment?.class?.name || "Deleted Class"}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            LKR {payment.amount.toLocaleString()}
                                        </div>
                                    </td>

                                    {/* Method */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 capitalize">
                                            {payment.method === 'payhere' ? (
                                                <><CreditCardIcon className="w-4 h-4 text-blue-500" /> Online</>
                                            ) : (
                                                <><BanknotesIcon className="w-4 h-4 text-purple-500" /> Bank Transfer</>
                                            )}
                                        </div>
                                        {/* Show Slip Button */}
                                        {payment.method === 'bank_transfer' && payment.rawPayload?.slipUrl && (
                                            <button 
                                                onClick={() => setSelectedSlip(getSlipUrl(payment.rawPayload?.slipUrl))}
                                                className="mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <DocumentMagnifyingGlassIcon className="w-3 h-3" /> View Slip
                                            </button>
                                        )}
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {moment(payment.paymentDate).format("MMM DD, HH:mm")}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-6 py-4">
                                        {payment.status === 'completed' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircleIcon className="w-3 h-3" /> Paid
                                            </span>
                                        )}
                                        {payment.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 animate-pulse">
                                                <ClockIcon className="w-3 h-3" /> Verify
                                            </span>
                                        )}
                                        {payment.status === 'failed' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <XCircleIcon className="w-3 h-3" /> Failed
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        {payment.status === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleVerify(payment._id, 'approve')}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-colors"
                                                    title="Approve"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleVerify(payment._id, 'reject')}
                                                    className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg transition-colors border border-red-200"
                                                    title="Reject"
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">No actions</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* --- IMAGE MODAL --- */}
        {selectedSlip && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedSlip(null)}>
                <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="font-bold text-gray-900">Payment Slip Proof</h3>
                        <button onClick={() => setSelectedSlip(null)} className="p-1 hover:bg-gray-100 rounded-full">
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                    <div className="p-4 bg-gray-100 flex justify-center">
                        <img 
                            src={selectedSlip} 
                            alt="Bank Slip" 
                            className="max-h-[70vh] object-contain rounded-lg border border-gray-300"
                        />
                    </div>
                    <div className="p-4 bg-white border-t flex justify-end">
                        <a href={selectedSlip} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                            Open Original
                        </a>
                    </div>
                </div>
            </div>
        )}

      </div>
    </DashboardLayout>
  );
}