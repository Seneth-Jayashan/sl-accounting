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
    isSameMonth 
} from "date-fns";
import {
  CreditCardIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  TagIcon,
  ShieldCheckIcon
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

const BANK_DETAILS = {
  bankName: import.meta.env.VITE_BANK_NAME,
  branch: import.meta.env.VITE_BRANCH_NAME,
  accountName: import.meta.env.VITE_ACCOUNT_NAME,
  accountNumber: import.meta.env.VITE_ACCOUNT_NUMBER,
};

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
  bundlePriceRevision?: number;
  bundlePricePaper?: number;
  bundlePriceFull?: number;
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
            if (enrollRes.enrollment?.paidMonths) {
                setPaidMonths(enrollRes.enrollment.paidMonths);
            }
            
            // Auto-select logic
            const currentMonth = format(new Date(), "yyyy-MM");
            if (!enrollRes.enrollment?.paidMonths?.includes(currentMonth)) {
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

  // --- 2. Generate Month Grid (STRICT 7 MONTH RANGE) ---
  const monthList = useMemo(() => {
      const today = startOfMonth(new Date());
      const start = subMonths(today, 3); 
      const end = addMonths(today, 3);

      try {
          const months = eachMonthOfInterval({ start, end });

          return months.map(date => {
              const value = format(date, "yyyy-MM");
              const isPaid = paidMonths.includes(value);
              const isCurrent = isSameMonth(date, today);
              const isPast = isBefore(date, today); 
              const isFuture = isAfter(date, today); 

              let status: "paid" | "overdue" | "due" | "advance" = "due";
              
              if (isPaid) status = "paid";
              else if (isPast) status = "overdue";
              else if (isFuture) status = "advance";
              else if (isCurrent) status = "due";

              return {
                  value,
                  label: format(date, "MMMM yyyy"),
                  shortLabel: format(date, "MMM ''yy"),
                  status
              };
          }).reverse(); 
      } catch (e) {
          console.error("Date interval error", e);
          return [];
      }
  }, [paidMonths]);

  // --- 3. Calculate Total ---
  const totalAmount = useMemo(() => {
      if (!classData) return 0;

      if (includeRevision && includePaper && classData.bundlePriceFull != null) {
          return classData.bundlePriceFull;
      }
      if (includeRevision && !includePaper && classData.bundlePriceRevision != null) {
          return classData.bundlePriceRevision;
      }
      if (!includeRevision && includePaper && classData.bundlePricePaper != null) {
          return classData.bundlePricePaper;
      }

      let total = classData.price;
      if (includeRevision && classData.linkedRevisionClass) total += classData.linkedRevisionClass.price;
      if (includePaper && classData.linkedPaperClass) total += classData.linkedPaperClass.price;
      return total;
  }, [classData, includeRevision, includePaper]);

  const isDiscountApplied = useMemo(() => {
      if (!classData) return false;
      let standardSum = classData.price;
      if (includeRevision && classData.linkedRevisionClass) standardSum += classData.linkedRevisionClass.price;
      if (includePaper && classData.linkedPaperClass) standardSum += classData.linkedPaperClass.price;
      return totalAmount < standardSum;
  }, [totalAmount, classData, includeRevision, includePaper]);

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

          const finalAmount = enrollmentRes.totalAmount || totalAmount; 
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
                <button onClick={() => navigate(-1)} className="group flex items-center text-sm font-bold text-gray-400 hover:text-brand-cerulean transition-colors mb-2 uppercase tracking-wider">
                    <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                <h1 className="text-3xl font-black text-brand-prussian tracking-tight">Monthly Payments</h1>
                <p className="text-gray-500 font-medium">Securely manage your fees for <span className="text-brand-cerulean font-bold">{classData?.name}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                <LockClosedIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">SSL Secured Checkout</span>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm animate-fade-in-up">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>{error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: Configuration */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Month Selection */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-aliceBlue/50 rounded-xl text-brand-cerulean"><CalendarDaysIcon className="w-6 h-6" /></div>
                        <h2 className="text-lg font-bold text-brand-prussian">Select Billing Cycle</h2>
                    </div>
                    
                    {monthList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {monthList.map((m) => {
                                const isSelected = selectedMonth === m.value;
                                const isPaid = m.status === 'paid';
                                
                                let borderClass = "border-gray-100 hover:border-gray-200 bg-white";
                                let textClass = "text-gray-600";
                                let badge = null;
                                let bgClass = "";

                                if (m.status === 'overdue' && !isPaid) {
                                    borderClass = "border-red-100 bg-red-50/30";
                                    badge = <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">Overdue</span>;
                                } else if (m.status === 'advance') {
                                    badge = <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">Advance</span>;
                                } else if (m.status === 'due') {
                                    borderClass = "border-brand-cerulean/30 bg-brand-aliceBlue/10";
                                    badge = <span className="text-[10px] font-bold text-brand-cerulean bg-brand-aliceBlue px-2 py-0.5 rounded-full border border-brand-cerulean/20">Due Now</span>;
                                }

                                if (isSelected) {
                                    borderClass = "border-brand-cerulean ring-2 ring-brand-cerulean bg-brand-aliceBlue/20 shadow-md";
                                }

                                if (isPaid) {
                                    bgClass = "bg-gray-50 opacity-60 cursor-not-allowed";
                                    borderClass = "border-gray-100";
                                }

                                return (
                                    <button
                                        key={m.value}
                                        disabled={isPaid}
                                        onClick={() => setSelectedMonth(m.value)}
                                        className={`relative p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${borderClass} ${bgClass}`}
                                    >
                                        <div>
                                            <p className={`font-bold text-sm sm:text-base ${textClass}`}>{m.label}</p>
                                            <p className="text-xs text-gray-400 mt-1 font-medium group-hover:text-brand-cerulean transition-colors">
                                                {m.status === 'paid' ? 'Access Active' : m.status === 'advance' ? 'Future Payment' : 'Pending Payment'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {isPaid ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : badge}
                                            {isSelected && !isPaid && <div className="w-3 h-3 bg-brand-cerulean rounded-full animate-bounce" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium">No billing cycles available yet.</p>
                        </div>
                    )}
                </div>

                {/* 2. Bundle Options */}
                {(classData?.linkedRevisionClass || classData?.linkedPaperClass) && (
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-brand-aliceBlue/50 rounded-xl text-brand-cerulean"><TagIcon className="w-6 h-6" /></div>
                            <h2 className="text-lg font-bold text-brand-prussian">Customize Your Plan</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {classData.linkedRevisionClass && (
                                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${includeRevision ? 'border-brand-cerulean bg-brand-aliceBlue/20' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${includeRevision ? "bg-brand-cerulean border-brand-cerulean" : "border-gray-300 bg-white"}`}>
                                        {includeRevision && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={includeRevision} onChange={e => setIncludeRevision(e.target.checked)} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-brand-prussian">Revision Class</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Add comprehensive revision sessions</p>
                                    </div>
                                    <span className="text-sm font-bold text-brand-cerulean">+{formatPrice(classData.linkedRevisionClass.price)}</span>
                                </label>
                            )}
                            {classData.linkedPaperClass && (
                                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${includePaper ? 'border-brand-cerulean bg-brand-aliceBlue/20' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${includePaper ? "bg-brand-cerulean border-brand-cerulean" : "border-gray-300 bg-white"}`}>
                                        {includePaper && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={includePaper} onChange={e => setIncludePaper(e.target.checked)} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-brand-prussian">Paper Class</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Add model paper discussions</p>
                                    </div>
                                    <span className="text-sm font-bold text-brand-cerulean">+{formatPrice(classData.linkedPaperClass.price)}</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Payment Method */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-aliceBlue/50 rounded-xl text-brand-cerulean"><CreditCardIcon className="w-6 h-6" /></div>
                        <h2 className="text-lg font-bold text-brand-prussian">Payment Method</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => setPaymentMethod('payhere')}
                            className={`p-5 rounded-2xl border-2 flex flex-col gap-3 transition-all text-left hover:shadow-md ${paymentMethod === 'payhere' ? 'border-brand-cerulean bg-brand-aliceBlue/20 ring-1 ring-brand-cerulean' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <div className="flex justify-between w-full">
                                <CreditCardIcon className={`w-6 h-6 ${paymentMethod === 'payhere' ? 'text-brand-cerulean' : 'text-gray-400'}`} />
                                {paymentMethod === 'payhere' && <div className="w-3 h-3 bg-brand-cerulean rounded-full" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-brand-prussian">Pay Online</p>
                                <p className="text-[10px] text-gray-500 mt-1">Instant activation via Card/Wallet</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setPaymentMethod('bank')}
                            className={`p-5 rounded-2xl border-2 flex flex-col gap-3 transition-all text-left hover:shadow-md ${paymentMethod === 'bank' ? 'border-brand-cerulean bg-brand-aliceBlue/20 ring-1 ring-brand-cerulean' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <div className="flex justify-between w-full">
                                <BuildingLibraryIcon className={`w-6 h-6 ${paymentMethod === 'bank' ? 'text-brand-cerulean' : 'text-gray-400'}`} />
                                {paymentMethod === 'bank' && <div className="w-3 h-3 bg-brand-cerulean rounded-full" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-brand-prussian">Bank Transfer</p>
                                <p className="text-[10px] text-gray-500 mt-1">Manual slip upload required</p>
                            </div>
                        </button>
                    </div>

                    {/* Bank Details Panel */}
                    {paymentMethod === "bank" && (
                        <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-fade-in">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Transfer Details</p>
                                <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 font-medium">Business Account</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Bank Name</p>
                                    <p className="font-bold text-gray-800">{BANK_DETAILS.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Number</p>
                                    <p className="font-mono font-bold text-brand-prussian text-lg tracking-wide">{BANK_DETAILS.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Branch</p>
                                    <p className="text-gray-700 font-medium">{BANK_DETAILS.branch}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Name</p>
                                    <p className="text-gray-700 font-medium">{BANK_DETAILS.accountName}</p>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 flex items-start sm:items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                                Please save your transfer slip/screenshot to upload in the next step.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Sticky Summary */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-6">
                    <h3 className="font-bold text-brand-prussian mb-6 text-lg">Order Summary</h3>
                    
                    <div className="space-y-4 mb-8 pb-8 border-b border-dashed border-gray-200">
                        <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-xl">
                            <span className="text-gray-500 font-medium">Billing Period</span>
                            <span className="font-bold text-brand-prussian">{selectedMonth ? format(new Date(selectedMonth), "MMMM yyyy") : "Select a month"}</span>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Theory Fee</span>
                                <span className="font-bold text-gray-900">{formatPrice(classData?.price || 0)}</span>
                            </div>
                            {includeRevision && classData?.linkedRevisionClass && (
                                <div className="flex justify-between text-sm text-brand-cerulean">
                                    <span className="font-medium">+ Revision Class</span>
                                    <span className="font-bold">{formatPrice(classData.linkedRevisionClass.price)}</span>
                                </div>
                            )}
                            {includePaper && classData?.linkedPaperClass && (
                                <div className="flex justify-between text-sm text-brand-cerulean">
                                    <span className="font-medium">+ Paper Class</span>
                                    <span className="font-bold">{formatPrice(classData.linkedPaperClass.price)}</span>
                                </div>
                            )}
                        </div>
                        
                        {isDiscountApplied && (
                           <div className="flex justify-between items-center text-xs sm:text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                              <span className="font-bold flex items-center gap-1"><TagIcon className="w-4 h-4" /> Bundle Savings</span>
                              <span className="font-bold">- {formatPrice((classData!.price + (includeRevision && classData!.linkedRevisionClass ? classData!.linkedRevisionClass.price : 0) + (includePaper && classData!.linkedPaperClass ? classData!.linkedPaperClass.price : 0)) - totalAmount)}</span>
                           </div>
                       )}
                    </div>

                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Payable</p>
                            <span className="text-2xl font-black text-brand-prussian tracking-tight">{formatPrice(totalAmount)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={submitting || !selectedMonth}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm ${
                            submitting || !selectedMonth
                            ? "bg-gray-300 cursor-not-allowed shadow-none" 
                            : "bg-brand-prussian hover:bg-brand-cerulean shadow-brand-prussian/20 hover:shadow-brand-cerulean/30"
                        }`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                {paymentMethod === 'payhere' ? "Pay Securely" : "Confirm & Upload"}
                                <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                            </>
                        )}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
                        <LockClosedIcon className="w-3 h-3" /> Encrypted & Secure Payment 
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}