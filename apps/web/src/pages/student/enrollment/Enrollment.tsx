import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CalendarDaysIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  UserIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

// Services & Context
import ClassService from "../../../services/ClassService";
import EnrollmentService from "../../../services/EnrollmentService";
import PaymentService from "../../../services/PaymentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Configuration ---
const IS_DEV = import.meta.env.MODE === "development";
const NOTIFY_URL_BASE = import.meta.env.VITE_NOTIFY_URL || "http://localhost:3000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const BANK_NAME = import.meta.env.VITE_BANK_NAME;
const BRANCH_NAME = import.meta.env.VITE_BRANCH_NAME;
const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME;
const ACCOUNT_NUMBER = import.meta.env.VITE_ACCOUNT_NUMBER;

const PAYHERE_CHECKOUT_URL = IS_DEV 
    ? "https://sandbox.payhere.lk/pay/checkout" 
    : "https://www.payhere.lk/pay/checkout";

const BANK_DETAILS = {
  bankName: BANK_NAME,
  branch: BRANCH_NAME,
  accountName: ACCOUNT_NAME,
  accountNumber: ACCOUNT_NUMBER,
};

interface ClassData {
  _id: string;
  name: string;
  price: number;
  level: string;
  coverImage?: string;
  timeSchedules: { day: number; startTime: string; endTime: string }[];
}

export default function EnrollmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"payhere" | "bank">("payhere");
  const [error, setError] = useState<string | null>(null);

  // --- 1. Fetch Class Data ---
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        navigate("/login", { state: { from: location.pathname } });
        return;
    }

    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await ClassService.getPublicClassById(id);
        const cls = Array.isArray(data) ? data[0] : data;
        setClassData(cls);
      } catch (err) {
        console.error("Load Error:", err);
        setError("Unable to load class details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, authLoading, navigate, location.pathname]);

  // --- 2. Handle Process ---
  const handleProcess = async () => {
    if (!id || !classData || !user) return;
    setSubmitting(true);
    setError(null);

    try {
      let enrollment;
      try {
          enrollment = await EnrollmentService.enrollInClass(id, user._id);
      } catch (e: any) {
          const msg = e.message || "";
          if (msg.toLowerCase().includes("already enrolled")) {
             const myEnrollments = await EnrollmentService.getMyEnrollments();
             const existing = myEnrollments.find((en: any) => {
                const enClassId = typeof en.class === 'string' ? en.class : en.class._id;
                return enClassId === id;
             });

             if (existing) {
                 enrollment = existing;
                 if (existing.paymentStatus === 'paid') {
                     navigate("/student/dashboard");
                     return;
                 }
             } else {
                 throw new Error("Enrollment recovery failed.");
             }
          } else {
             throw e;
          }
      }
      
      const enrollmentId = enrollment._id;

      if (paymentMethod === "bank") {
          navigate(`/student/payment/upload/${enrollmentId}`);
      } 
      else if (paymentMethod === "payhere") {
          const orderId = `${enrollmentId}_${Date.now()}`;
          const signatureData = await PaymentService.initiatePayHere(classData.price, orderId);

          const payHereParams = {
              merchant_id: signatureData.merchant_id,
              return_url: `${window.location.origin}/student/classes?payment=success`,
              cancel_url: `${window.location.origin}/student/enrollment/${id}?payment=cancel`,
              notify_url: `${NOTIFY_URL_BASE}/payments/payhere-webhook`,
              order_id: orderId,
              items: classData.name,
              currency: "LKR",
              amount: signatureData.amount,
              hash: signatureData.hash,
              first_name: user.firstName,
              last_name: user.lastName,
              email: user.email,
              phone: user.phoneNumber || "0770000000",
              address: "Sri Lanka",
              city: "Colombo",
              country: "Sri Lanka",
              custom_1: enrollmentId 
          };

          const form = document.createElement("form");
          form.setAttribute("method", "POST");
          form.setAttribute("action", PAYHERE_CHECKOUT_URL);

          Object.keys(payHereParams).forEach(key => {
              const input = document.createElement("input");
              input.setAttribute("type", "hidden");
              input.setAttribute("name", key);
              const val = (payHereParams as any)[key];
              input.setAttribute("value", val ? val.toString().trim() : "");
              form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message || "Payment initiation failed.");
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(price);

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-brand-prussian">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-gray-500 animate-pulse">Preparing checkout...</p>
    </div>
  );

  if (!classData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Class Not Found</h3>
        <p className="text-gray-500 mb-6 max-w-md">The class you are looking for might have been removed or is currently unavailable.</p>
        <button onClick={() => navigate("/classes")} className="px-6 py-2.5 bg-brand-prussian text-white rounded-xl font-bold hover:bg-brand-cerulean transition-colors">
            Browse Classes
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
            <button 
                onClick={() => navigate(-1)} 
                className="group flex items-center text-gray-500 hover:text-brand-prussian transition-colors px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm sm:text-base"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                <span className="font-semibold">Back</span>
            </button>
            <div className="flex items-center gap-2 text-green-600 bg-white px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border border-green-100 shadow-sm">
                <LockClosedIcon className="w-3 h-3" /> SSL Secured
            </div>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm animate-fade-in-up">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>
                {error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian mb-2 sm:mb-6">Checkout</h1>

            {/* 1. Order Summary Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 relative overflow-hidden">
                
                <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                        {classData.coverImage ? (
                            <img src={API_BASE_URL + '/' + classData.coverImage} className="w-full h-full object-cover" alt="Class" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <BuildingLibraryIcon className="w-8 h-8 mb-1" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold tracking-wider text-brand-cerulean uppercase bg-brand-aliceBlue px-2 py-1 rounded-md mb-2 inline-block">
                            {classData.level || "Course"}
                        </span>
                        <h2 className="text-lg sm:text-lg font-bold text-gray-900 leading-tight mb-2 truncate">{classData.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <CalendarDaysIcon className="w-4 h-4" /> 
                                <span>Monthly</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <UserIcon className="w-4 h-4" /> 
                                <span>{user?.firstName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price</p>
                        <p className="text-sm font-black text-brand-prussian">{formatPrice(classData.price)}</p>
                    </div>
                </div>
            </div>

            {/* 2. Payment Method Selection */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
               <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Select Payment Method</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                 
                 {/* PayHere Option */}
                 <button 
                   onClick={() => setPaymentMethod("payhere")}
                   className={`relative border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all text-left group ${
                       paymentMethod === "payhere" 
                       ? "border-brand-cerulean bg-brand-aliceBlue/30 shadow-md ring-1 ring-brand-cerulean/20" 
                       : "border-gray-100 hover:border-brand-cerulean/50 hover:bg-gray-50"
                   }`}
                 >
                     <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                         paymentMethod === "payhere" ? "border-brand-cerulean" : "border-gray-300 group-hover:border-gray-400"
                     }`}>
                         {paymentMethod === "payhere" && <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-brand-cerulean" />}
                     </div>
                     <div className="flex-1">
                         <div className="flex justify-between items-center mb-1">
                             <p className={`font-bold text-sm sm:text-base transition-colors ${paymentMethod === 'payhere' ? 'text-brand-prussian' : 'text-gray-700'}`}>Pay Online</p>
                             <CreditCardIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${paymentMethod === 'payhere' ? 'text-brand-cerulean' : 'text-gray-400'}`} />
                         </div>
                         <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">Instant access. Cards & Mobile Wallets.</p>
                     </div>
                 </button>

                 {/* Bank Transfer Option */}
                 <button 
                   onClick={() => setPaymentMethod("bank")}
                   className={`relative border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all text-left group ${
                       paymentMethod === "bank" 
                       ? "border-brand-cerulean bg-brand-aliceBlue/30 shadow-md ring-1 ring-brand-cerulean/20" 
                       : "border-gray-100 hover:border-brand-cerulean/50 hover:bg-gray-50"
                   }`}
                 >
                     <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                         paymentMethod === "bank" ? "border-brand-cerulean" : "border-gray-300 group-hover:border-gray-400"
                     }`}>
                         {paymentMethod === "bank" && <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-brand-cerulean" />}
                     </div>
                     <div className="flex-1">
                         <div className="flex justify-between items-center mb-1">
                             <p className={`font-bold text-sm sm:text-base transition-colors ${paymentMethod === 'bank' ? 'text-brand-prussian' : 'text-gray-700'}`}>Bank Transfer</p>
                             <BuildingLibraryIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${paymentMethod === 'bank' ? 'text-brand-cerulean' : 'text-gray-400'}`} />
                         </div>
                         <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">Manual slip upload required.</p>
                     </div>
                 </button>

               </div>

               {/* Bank Details Panel */}
               {paymentMethod === "bank" && (
                   <div className="mt-6 p-5 sm:p-6 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                          <p className="text-xs sm:text-sm font-bold text-gray-700">Transfer Information</p>
                          <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">Business Account</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
                          <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Bank Name</p>
                              <p className="font-semibold text-gray-800">{BANK_DETAILS.bankName}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Number</p>
                              <p className="font-mono font-bold text-brand-prussian text-base sm:text-lg tracking-wide">{BANK_DETAILS.accountNumber}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Branch</p>
                              <p className="text-gray-700">{BANK_DETAILS.branch}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Name</p>
                              <p className="text-gray-700">{BANK_DETAILS.accountName}</p>
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

          {/* RIGHT COLUMN: Floating Summary */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 sticky top-4 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6 text-base sm:text-lg">Order Summary</h3>
                
                <div className="space-y-3 sm:space-y-4 mb-6 border-b border-gray-100 pb-6">
                   <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Tuition Fee</span>
                      <span className="font-medium text-gray-900">{formatPrice(classData.price)}</span>
                   </div>
                   <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Service Charge</span>
                      <span className="text-gray-900 font-medium">LKR 0.00</span>
                   </div>
                   <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Registration</span>
                      <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded">FREE</span>
                   </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                   <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Payable</p>
                       <span className="text-xl sm:text-2xl font-black text-brand-prussian">{formatPrice(classData.price)}</span>
                   </div>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={submitting}
                  className={`w-full py-3.5 sm:py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-sm ${
                    submitting 
                        ? "bg-gray-400 cursor-not-allowed shadow-none" 
                        : "bg-brand-prussian hover:bg-brand-cerulean shadow-brand-prussian/20 hover:shadow-brand-cerulean/30"
                  }`}
                >
                  {submitting ? (
                      <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                      </>
                  ) : (
                      <>
                          {paymentMethod === "payhere" ? "Pay Securely" : "Confirm Enrollment"}
                          <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                      </>
                  )}
                </button>

                <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-[10px] text-gray-400 text-center leading-tight max-w-[200px]">
                        By proceeding, you agree to the <span className="underline cursor-pointer hover:text-brand-cerulean">Terms</span> & <span className="underline cursor-pointer hover:text-brand-cerulean">Refund Policy</span>.
                    </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}