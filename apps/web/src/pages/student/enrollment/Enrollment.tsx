import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format, addMonths, startOfMonth } from "date-fns";
import {
  CalendarDaysIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  UserIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckCircleIcon,
  TagIcon
} from "@heroicons/react/24/outline";

// Services & Context
import ClassService from "../../../services/ClassService";
import EnrollmentService from "../../../services/EnrollmentService";
import PaymentService from "../../../services/PaymentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Configuration ---
const NOTIFY_URL_BASE = import.meta.env.VITE_NOTIFY_URL || "http://localhost:3000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const PAYHERE_CHECKOUT_URL = import.meta.env.VITE_PAYHERE_CHECKOUT_URL ;

// Example: An array of multiple bank objects
const BANK_OPTIONS = JSON.parse(import.meta.env.VITE_BANK_DETAILS || "[]") as BankAccount[];
// --- Interfaces ---
interface LinkedClass {
    _id: string;
    name: string;
    price: number;
    type: string;
}

interface ClassData {
  _id: string;
  name: string;
  price: number;
  level: string;
  coverImage?: string;
  timeSchedules: { day: number; startTime: string; endTime: string }[];
  linkedRevisionClass?: LinkedClass;
  linkedPaperClass?: LinkedClass;
  
  // Bundle Prices
  bundlePriceRevision?: number; // Theory + Revision
  bundlePricePaper?: number;    // Theory + Paper
  bundlePriceFull?: number;     // Theory + Revision + Paper
}

interface BankAccount {
  id: number;
  bankName: string;
  branch: string;
  accountName: string;
  accountNumber: string;
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

  // --- SELECTION STATES ---
  const [includeRevision, setIncludeRevision] = useState(false);
  const [includePaper, setIncludePaper] = useState(false);
  
  // --- MONTH SELECTION ---
  const [targetMonth, setTargetMonth] = useState<string>(format(new Date(), "yyyy-MM")); 
  const [paidMonths, setPaidMonths] = useState<string[]>([]);

  // --- 1. Fetch Class Data & History ---
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        navigate("/login", { state: { from: location.pathname } });
        return;
    }

    const initPage = async () => {
      if (!id) return;
      try {
        const data = await ClassService.getPublicClassById(id);
        const cls = Array.isArray(data) ? data[0] : data;
        setClassData(cls);

        const enrollmentRes = await EnrollmentService.enrollInClass(id, user._id);
        if (enrollmentRes.enrollment?.paidMonths) {
            setPaidMonths(enrollmentRes.enrollment.paidMonths);
        }

      } catch (err) {
        console.error("Load Error:", err);
        setError("Unable to load class details.");
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [id, user, authLoading, navigate, location.pathname]);

  // --- 2. Calculate Month Options ---
  const monthOptions = useMemo(() => {
      const options = [];
      const today = startOfMonth(new Date());
      for (let i = 0; i < 6; i++) {
          const date = addMonths(today, i);
          const value = format(date, "yyyy-MM");
          const label = format(date, "MMMM yyyy");
          const isPaid = paidMonths.includes(value);
          options.push({ value, label, isPaid });
      }
      return options;
  }, [paidMonths]);

  // --- 3. PRICING LOGIC (UPDATED) ---

  // A. Calculate the "Standard" price (Sum of individual components)
  const standardTotal = useMemo(() => {
      if (!classData) return 0;
      let total = classData.price;
      if (includeRevision && classData.linkedRevisionClass) total += classData.linkedRevisionClass.price;
      if (includePaper && classData.linkedPaperClass) total += classData.linkedPaperClass.price;
      return total;
  }, [classData, includeRevision, includePaper]);

  // B. Calculate the "Payable" price (Applying Bundles)
  const finalTotal = useMemo(() => {
      if (!classData) return 0;

      // Case 1: All 3 (Theory + Rev + Paper)
      if (includeRevision && includePaper) {
          // If a specific full bundle price exists, use it. Otherwise, sum.
          return classData.bundlePriceFull ?? (classData.price + (classData.linkedRevisionClass?.price || 0) + (classData.linkedPaperClass?.price || 0));
      }

      // Case 2: Theory + Revision
      if (includeRevision && !includePaper) {
          return classData.bundlePriceRevision ?? (classData.price + (classData.linkedRevisionClass?.price || 0));
      }

      // Case 3: Theory + Paper
      if (!includeRevision && includePaper) {
          return classData.bundlePricePaper ?? (classData.price + (classData.linkedPaperClass?.price || 0));
      }

      // Case 4: Theory Only
      return classData.price;
  }, [classData, includeRevision, includePaper]);

  // C. Determine Discount
  const discountAmount = standardTotal - finalTotal;
  const isBundleActive = discountAmount > 0;

  // --- 4. Handle Process ---
  const handleProcess = async () => {
    if (!id || !classData || !user) return;
    
    if (paidMonths.includes(targetMonth)) {
        setError("You have already paid for this month.");
        return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Enrollment 
      // We pass the flags so backend also knows which bundles to activate
      const enrollmentRes = await EnrollmentService.enrollInClass(id, user._id, {
          includeRevision,
          includePaper
      });
      
      const enrollmentId = enrollmentRes.enrollment._id; 
      
      // We trust the backend's calculation, but fallback to our frontend calc if needed
      const amountToPay = enrollmentRes.totalAmount || finalTotal;

      // 2. Payment Processing
      if (paymentMethod === "bank") {
          navigate(`/student/payment/upload/${enrollmentId}`, { 
              state: { 
                  amount: amountToPay, 
                  targetMonth: targetMonth,
                  notes: isBundleActive ? "Bundle Price Applied" : "Standard Enrollment"
              } 
          });
      } 
      else if (paymentMethod === "payhere") {
          const orderId = `${enrollmentId}_${Date.now()}`;
          const signatureData = await PaymentService.initiatePayHere(amountToPay, orderId);

          const payHereParams = {
              merchant_id: signatureData.merchant_id,
              return_url: `${window.location.origin}/student/classes?payment=success`,
              cancel_url: `${window.location.origin}/student/enrollment/${id}?payment=cancel`,
              notify_url: `${NOTIFY_URL_BASE}/payments/payhere-webhook`,
              order_id: orderId,
              items: `${classData.name} - ${format(new Date(targetMonth), "MMMM")}${includeRevision ? " + Rev" : ""}${includePaper ? " + Paper" : ""}`,
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
              custom_1: enrollmentId,
              custom_2: targetMonth 
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
        <p className="font-semibold text-gray-500 animate-pulse">Loading details...</p>
    </div>
  );

  if (!classData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Class Not Found</h3>
        <button onClick={() => navigate("/classes")} className="px-6 py-2.5 bg-brand-prussian text-white rounded-xl font-bold">Browse Classes</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
            <button onClick={() => navigate(-1)} className="group flex items-center text-gray-500 hover:text-brand-prussian transition-colors px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm sm:text-base">
                <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> <span className="font-semibold">Back</span>
            </button>
            <div className="flex items-center gap-2 text-green-600 bg-white px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border border-green-100 shadow-sm">
                <LockClosedIcon className="w-3 h-3" /> SSL Secured
            </div>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm animate-fade-in-up">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>{error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian mb-2 sm:mb-6">Checkout</h1>

            {/* 1. Main Class Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 relative overflow-hidden">
                <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                        {classData.coverImage ? (
                            <img src={API_BASE_URL + '/' + classData.coverImage} className="w-full h-full object-cover" alt="Class" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50"><BuildingLibraryIcon className="w-8 h-8 mb-1" /></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold tracking-wider text-brand-cerulean uppercase bg-brand-aliceBlue px-2 py-1 rounded-md mb-2 inline-block">{classData.level || "Course"}</span>
                        <h2 className="text-lg sm:text-lg font-bold text-gray-900 leading-tight mb-2 truncate">{classData.name} (Theory)</h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-1.5"><CalendarDaysIcon className="w-4 h-4" /> <span>Monthly</span></div>
                            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> <span>{user?.firstName}</span></div>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price</p>
                        <p className="text-sm font-black text-brand-prussian">{formatPrice(classData.price)}</p>
                    </div>
                </div>
            </div>

            {/* 2. Select Billing Month */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Select Billing Month</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {monthOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => !option.isPaid && setTargetMonth(option.value)}
                            disabled={option.isPaid}
                            className={`
                                relative p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-1
                                ${option.isPaid 
                                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" 
                                    : targetMonth === option.value
                                        ? "bg-brand-cerulean text-white border-brand-cerulean shadow-md" 
                                        : "bg-white border-gray-200 text-gray-600 hover:border-brand-cerulean hover:text-brand-cerulean" 
                                }
                            `}
                        >
                            <span>{option.label}</span>
                            {option.isPaid && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 border border-green-100">
                                    <CheckCircleIcon className="w-3 h-3" /> Paid
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Bundle Options (UPDATED UI) */}
            {(classData.linkedRevisionClass || classData.linkedPaperClass) && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Add-On Classes</h3>
                    <div className="space-y-3">
                        
                        {classData.linkedRevisionClass && (
                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${includeRevision ? "border-brand-cerulean bg-brand-aliceBlue/20" : "border-gray-100 hover:border-gray-200"}`}>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${includeRevision ? "bg-brand-cerulean border-brand-cerulean" : "border-gray-300 bg-white"}`}>
                                    {includeRevision && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={includeRevision} onChange={(e) => setIncludeRevision(e.target.checked)} />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 text-sm">{classData.linkedRevisionClass.name}</p>
                                    <p className="text-xs text-gray-500">Revision Session</p>
                                </div>
                                <p className="font-bold text-brand-prussian text-sm">+ {formatPrice(classData.linkedRevisionClass.price)}</p>
                            </label>
                        )}

                        {classData.linkedPaperClass && (
                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${includePaper ? "border-brand-cerulean bg-brand-aliceBlue/20" : "border-gray-100 hover:border-gray-200"}`}>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${includePaper ? "bg-brand-cerulean border-brand-cerulean" : "border-gray-300 bg-white"}`}>
                                    {includePaper && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={includePaper} onChange={(e) => setIncludePaper(e.target.checked)} />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 text-sm">{classData.linkedPaperClass.name}</p>
                                    <p className="text-xs text-gray-500">Paper Discussion</p>
                                </div>
                                <p className="font-bold text-brand-prussian text-sm">+ {formatPrice(classData.linkedPaperClass.price)}</p>
                            </label>
                        )}
                    </div>
                    {/* Visual Hint about bundling */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2 text-xs text-blue-700">
                        <TagIcon className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Tip: Select multiple classes to unlock exclusive <strong>Bundle Pricing</strong>.</p>
                    </div>
                </div>
            )}

            {/* 4. Payment Method Selection */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
               <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Select Payment Method</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                 {/* PayHere */}
                 <button 
                   onClick={() => setPaymentMethod("payhere")}
                   className={`relative border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all text-left group ${paymentMethod === "payhere" ? "border-brand-cerulean bg-brand-aliceBlue/30 shadow-md ring-1 ring-brand-cerulean/20" : "border-gray-100 hover:border-brand-cerulean/50 hover:bg-gray-50"}`}
                 >
                     <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === "payhere" ? "border-brand-cerulean" : "border-gray-300 group-hover:border-gray-400"}`}>
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

                 {/* Bank Transfer */}
                 <button 
                   onClick={() => setPaymentMethod("bank")}
                   className={`relative border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all text-left group ${paymentMethod === "bank" ? "border-brand-cerulean bg-brand-aliceBlue/30 shadow-md ring-1 ring-brand-cerulean/20" : "border-gray-100 hover:border-brand-cerulean/50 hover:bg-gray-50"}`}
                 >
                     <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === "bank" ? "border-brand-cerulean" : "border-gray-300 group-hover:border-gray-400"}`}>
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
                    <div className="mt-6 space-y-4"> {/* Space-y-4 add chesamu gap kosam */}
                        
                        {BANK_OPTIONS.map((bank) => (
                            <div key={bank.id} className="p-5 sm:p-6 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 animate-fade-in">
                                
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs sm:text-sm font-bold text-gray-700">Transfer Information</p>
                                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                                        {bank.bankName} Account
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
                                    {/* Bank Name */}
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Bank Name</p>
                                        <p className="font-semibold text-gray-800">{bank.bankName}</p>
                                    </div>
                                    
                                    {/* Account Number */}
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Number</p>
                                        <p className="font-mono font-bold text-brand-prussian text-base sm:text-lg tracking-wide">
                                            {bank.accountNumber}
                                        </p>
                                    </div>

                                    {/* Branch */}
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Branch</p>
                                        <p className="text-gray-700">{bank.branch}</p>
                                    </div>

                                    {/* Account Name */}
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Name</p>
                                        <p className="text-gray-700">{bank.accountName}</p>
                                    </div>
                                </div>

                                {/* Footer Message */}
                                <div className="mt-5 pt-4 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 flex items-start sm:items-center gap-2">
                                    <ShieldCheckIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                                    Please save your transfer slip/screenshot.
                                </div>

                            </div>
                        ))}

                    </div>
                )}
            </div>
          </div>

          {/* RIGHT COLUMN: Floating Summary (UPDATED WITH BUNDLE LOGIC) */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 sticky top-4 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6 text-base sm:text-lg">Order Summary</h3>
                
                <div className="space-y-3 sm:space-y-4 mb-6 border-b border-gray-100 pb-6">
                   <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Billing Period</span>
                      <span className="font-bold text-brand-prussian">{format(new Date(targetMonth), "MMMM yyyy")}</span>
                   </div>
                   
                   <div className="border-t border-dashed border-gray-200 pt-3"></div>

                   {/* Standard Breakdown */}
                   <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Theory Class</span>
                      <span className="font-medium text-gray-900">{formatPrice(classData.price)}</span>
                   </div>
                   {includeRevision && classData.linkedRevisionClass && (
                       <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                          <span className="font-medium">+ Revision Class</span>
                          <span className="font-medium">{formatPrice(classData.linkedRevisionClass.price)}</span>
                       </div>
                   )}
                   {includePaper && classData.linkedPaperClass && (
                       <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                          <span className="font-medium">+ Paper Class</span>
                          <span className="font-medium">{formatPrice(classData.linkedPaperClass.price)}</span>
                       </div>
                   )}
                   
                   {/* DISCOUNT LINE ITEM */}
                   {isBundleActive && (
                       <div className="flex justify-between text-xs sm:text-sm text-green-600 bg-green-50 px-2 py-1.5 rounded-lg mt-2">
                          <span className="font-bold flex items-center gap-1"><TagIcon className="w-3.5 h-3.5" /> Bundle Discount</span>
                          <span className="font-bold">- {formatPrice(discountAmount)}</span>
                       </div>
                   )}

                   <div className="flex justify-between text-xs sm:text-sm pt-2">
                      <span className="text-gray-500">Service Charge</span>
                      <span className="text-gray-900 font-medium">LKR 0.00</span>
                   </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                   <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Payable</p>
                       <div className="flex items-baseline gap-2">
                            {/* Strikethrough original price if discounted */}
                            {isBundleActive && (
                                <span className="text-sm text-gray-400 line-through decoration-gray-400">{formatPrice(standardTotal)}</span>
                            )}
                            <span className="text-xl sm:text-2xl font-black text-brand-prussian">{formatPrice(finalTotal)}</span>
                       </div>
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