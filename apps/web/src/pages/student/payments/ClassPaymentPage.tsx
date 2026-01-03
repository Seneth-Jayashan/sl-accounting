import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    format, 
    startOfMonth, 
    addMonths, 
    subMonths,
    eachMonthOfInterval, 
    isBefore, 
    isAfter,
} from "date-fns";
import {
  CreditCardIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

// Services & Context
import ClassService from "../../../services/ClassService";
import EnrollmentService from "../../../services/EnrollmentService";
import PaymentService from "../../../services/PaymentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Config ---
const IS_DEV = import.meta.env.MODE === "development";
const NOTIFY_URL_BASE = import.meta.env.VITE_NOTIFY_URL || "http://localhost:3000";
const PAYHERE_CHECKOUT_URL = IS_DEV ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";

// --- Interfaces ---
interface LinkedClass { _id: string; name: string; price: number; }
interface ClassData {
  _id: string;
  name: string;
  price: number;
  level: string;
  coverImage?: string;
  firstSessionDate?: string; 
  linkedRevisionClass?: LinkedClass;
  linkedPaperClass?: LinkedClass;
}

export default function ClassPaymentPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [paidMonths, setPaidMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [includeRevision, setIncludeRevision] = useState(false);
  const [includePaper, setIncludePaper] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"payhere" | "bank">("payhere");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Load Data ---
  useEffect(() => {
    if (!classId || !user) return;

    const loadData = async () => {
        try {
            const clsRes = await ClassService.getPublicClassById(classId);
            const cls = Array.isArray(clsRes) ? clsRes[0] : clsRes;
            setClassData(cls);

            const enrollRes = await EnrollmentService.enrollInClass(classId, user._id);
            if (enrollRes.enrollment.paidMonths) {
                setPaidMonths(enrollRes.enrollment.paidMonths);
            }
            
            // Auto-select logic
            const currentMonth = format(new Date(), "yyyy-MM");
            if (!enrollRes.enrollment.paidMonths?.includes(currentMonth)) {
                setSelectedMonth(currentMonth);
            } else {
                setSelectedMonth(format(addMonths(new Date(), 1), "yyyy-MM"));
            }

        } catch (err) {
            console.error(err);
            setError("Failed to load class details.");
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [classId, user]);

  // --- 2. Generate Month Grid (FIXED) ---
  const monthList = useMemo(() => {
      // 1. Get Today
      const today = startOfMonth(new Date());
      
      // 2. Define Range: STRICTLY -3 months to +3 months (Total 7 months)
      // We removed the 'firstSessionDate' check so it always shows history
      const start = subMonths(today, 3); 
      const end = addMonths(today, 3);

      try {
          const months = eachMonthOfInterval({ start, end });

          return months.map(date => {
              const value = format(date, "yyyy-MM");
              const isPaid = paidMonths.includes(value);
              const isPast = isBefore(date, today); // Before current month
              const isFuture = isAfter(date, today); // After current month

              let status: "paid" | "overdue" | "due" | "advance" = "due";
              
              if (isPaid) {
                  status = "paid";
              } else if (isPast) {
                  status = "overdue";
              } else if (isFuture) {
                  status = "advance";
              }

              return {
                  value,
                  label: format(date, "MMMM yyyy"),
                  shortLabel: format(date, "MMM ''yy"),
                  status
              };
          }).reverse(); // Show Future at top, Past at bottom
      } catch (e) {
          console.error("Date interval error", e);
          return [];
      }
  }, [paidMonths]); // Removed classData dependency as we calculate strictly from today

  // --- 3. Calculate Total ---
  const totalAmount = useMemo(() => {
      if (!classData) return 0;
      let total = classData.price;
      if (includeRevision && classData.linkedRevisionClass) total += classData.linkedRevisionClass.price;
      if (includePaper && classData.linkedPaperClass) total += classData.linkedPaperClass.price;
      return total;
  }, [classData, includeRevision, includePaper]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(price);

  // --- 4. Handle Pay ---
  const handlePayment = async () => {
      if (!selectedMonth || !classData || !user) return;
      setSubmitting(true);
      setError(null);

      try {
          const enrollmentRes = await EnrollmentService.enrollInClass(classData._id, user._id, {
              includeRevision, includePaper
          });

          const finalAmount = totalAmount; 
          const enrollmentId = enrollmentRes.enrollment._id;

          if (paymentMethod === "bank") {
              navigate(`/student/payment/upload/${enrollmentId}`, {
                  state: { amount: finalAmount, targetMonth: selectedMonth }
              });
          } else {
              const orderId = `${enrollmentId}_${Date.now()}`;
              const signature = await PaymentService.initiatePayHere(finalAmount, orderId);

              const params = {
                  merchant_id: signature.merchant_id,
                  return_url: `${window.location.origin}/student/classes?payment=success`,
                  cancel_url: `${window.location.origin}/student/classes/${classId}/pay?error=cancel`,
                  notify_url: `${NOTIFY_URL_BASE}/payments/payhere-webhook`,
                  order_id: orderId,
                  items: `${classData.name} [${selectedMonth}]`,
                  currency: "LKR",
                  amount: signature.amount,
                  hash: signature.hash,
                  first_name: user.firstName,
                  last_name: user.lastName,
                  email: user.email,
                  phone: user.phoneNumber || "0770000000",
                  address: "Sri Lanka",
                  city: "Colombo",
                  country: "Sri Lanka",
                  custom_1: enrollmentId,
                  custom_2: selectedMonth 
              };

              const form = document.createElement("form");
              form.setAttribute("method", "POST");
              form.setAttribute("action", PAYHERE_CHECKOUT_URL);
              Object.keys(params).forEach(key => {
                  const input = document.createElement("input");
                  input.type = "hidden";
                  input.name = key;
                  input.value = (params as any)[key];
                  form.appendChild(input);
              });
              document.body.appendChild(form);
              form.submit();
          }

      } catch (err: any) {
          setError(err.message || "Payment processing failed.");
          setSubmitting(false);
      }
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-brand-cerulean border-t-transparent rounded-full animate-spin"/>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-all text-gray-500 hover:text-brand-prussian shadow-sm">
                <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-brand-prussian">Monthly Payments</h1>
                <p className="text-sm text-gray-500">Manage fees for <span className="font-semibold text-brand-cerulean">{classData?.name}</span></p>
            </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* LEFT: Month Selection Grid */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-gray-400" /> Select Month
                    </h2>
                    
                    {monthList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {monthList.map((m) => {
                                const isSelected = selectedMonth === m.value;
                                const isPaid = m.status === 'paid';
                                
                                let borderClass = "border-gray-200 hover:border-gray-300";
                                let bgClass = "bg-white";
                                let textClass = "text-gray-600";
                                let badge = null;

                                if (m.status === 'overdue' && !isPaid) {
                                    borderClass = "border-red-200";
                                    bgClass = "bg-red-50/50";
                                    badge = <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>;
                                } else if (m.status === 'advance') {
                                    badge = <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Advance</span>;
                                } else if (m.status === 'due') {
                                    borderClass = "border-blue-200";
                                    bgClass = "bg-blue-50/30";
                                    badge = <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Due Now</span>;
                                }

                                if (isSelected) {
                                    borderClass = "border-brand-cerulean ring-1 ring-brand-cerulean";
                                    bgClass = "bg-brand-aliceBlue/20";
                                }

                                if (isPaid) {
                                    bgClass = "bg-gray-50 opacity-70";
                                    borderClass = "border-gray-100";
                                }

                                return (
                                    <button
                                        key={m.value}
                                        disabled={isPaid}
                                        onClick={() => setSelectedMonth(m.value)}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${borderClass} ${bgClass}`}
                                    >
                                        <div>
                                            <p className={`font-bold text-sm ${textClass}`}>{m.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{m.status === 'paid' ? 'Access Active' : m.status === 'advance' ? 'Future Payment' : 'Pending Payment'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {isPaid ? (
                                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                            ) : (
                                                badge
                                            )}
                                            {isSelected && !isPaid && <div className="w-3 h-3 bg-brand-cerulean rounded-full" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <p>No billing cycles available yet.</p>
                        </div>
                    )}
                </div>

                {/* Bundle Options */}
                {(classData?.linkedRevisionClass || classData?.linkedPaperClass) && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-800 mb-4">Add Extras</h2>
                        <div className="space-y-3">
                            {classData.linkedRevisionClass && (
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${includeRevision ? 'border-brand-cerulean bg-blue-50/30' : 'border-gray-200'}`}>
                                    <input type="checkbox" className="w-5 h-5 text-brand-cerulean rounded" checked={includeRevision} onChange={e => setIncludeRevision(e.target.checked)} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700">Revision Class</p>
                                        <p className="text-xs text-gray-500">Add comprehensive revision</p>
                                    </div>
                                    <span className="text-sm font-bold text-brand-prussian">+{formatPrice(classData.linkedRevisionClass.price)}</span>
                                </label>
                            )}
                            {classData.linkedPaperClass && (
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${includePaper ? 'border-brand-cerulean bg-blue-50/30' : 'border-gray-200'}`}>
                                    <input type="checkbox" className="w-5 h-5 text-brand-cerulean rounded" checked={includePaper} onChange={e => setIncludePaper(e.target.checked)} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700">Paper Class</p>
                                        <p className="text-xs text-gray-500">Add paper discussion</p>
                                    </div>
                                    <span className="text-sm font-bold text-brand-prussian">+{formatPrice(classData.linkedPaperClass.price)}</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Payment Summary */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-6">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg">Payment Summary</h3>
                    
                    <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Selected Month</span>
                            <span className="font-bold text-brand-prussian">{selectedMonth ? format(new Date(selectedMonth), "MMMM yyyy") : "None"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Theory Fee</span>
                            <span className="font-medium">{formatPrice(classData?.price || 0)}</span>
                        </div>
                        {includeRevision && classData?.linkedRevisionClass && (
                            <div className="flex justify-between text-sm text-blue-600">
                                <span>+ Revision</span>
                                <span>{formatPrice(classData.linkedRevisionClass.price)}</span>
                            </div>
                        )}
                        {includePaper && classData?.linkedPaperClass && (
                            <div className="flex justify-between text-sm text-blue-600">
                                <span>+ Paper</span>
                                <span>{formatPrice(classData.linkedPaperClass.price)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-end mb-8">
                        <span className="text-xs font-bold text-gray-400 uppercase">Total</span>
                        <span className="text-3xl font-black text-brand-prussian">{formatPrice(totalAmount)}</span>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <button 
                            onClick={() => setPaymentMethod('payhere')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'payhere' ? 'border-brand-cerulean bg-blue-50 text-brand-cerulean' : 'border-gray-200 text-gray-500'}`}
                        >
                            <CreditCardIcon className="w-5 h-5 mx-auto mb-1" />
                            Pay Online
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('bank')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'bank' ? 'border-brand-cerulean bg-blue-50 text-brand-cerulean' : 'border-gray-200 text-gray-500'}`}
                        >
                            <BuildingLibraryIcon className="w-5 h-5 mx-auto mb-1" />
                            Bank Slip
                        </button>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={submitting || !selectedMonth}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                            submitting || !selectedMonth
                            ? "bg-gray-300 cursor-not-allowed shadow-none" 
                            : "bg-brand-prussian hover:bg-brand-cerulean shadow-blue-900/20 active:scale-95"
                        }`}
                    >
                        {submitting ? "Processing..." : paymentMethod === 'payhere' ? "Pay Now" : "Upload Slip"}
                    </button>
                    
                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                        <LockClosedIcon className="w-3 h-3" /> Secure Payment 
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}