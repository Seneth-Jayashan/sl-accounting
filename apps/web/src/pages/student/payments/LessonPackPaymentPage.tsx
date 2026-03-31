import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCardIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  PlayCircleIcon
} from "@heroicons/react/24/outline";

// Services & Context
import LessonPackService, { type LessonPackData } from "../../../services/LessonPackService";
import EnrollmentService from "../../../services/EnrollmentService";
import PaymentService from "../../../services/PaymentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Config ---
const IS_DEV = import.meta.env.MODE === "development";
const NOTIFY_URL_BASE = import.meta.env.VITE_NOTIFY_URL || "http://localhost:3000";
const PAYHERE_CHECKOUT_URL = IS_DEV ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const BANK_OPTIONS = JSON.parse(import.meta.env.VITE_BANK_DETAILS || "[]") as BankAccount[];

interface BankAccount {
  id: number;
  bankName: string;
  branch: string;
  accountName: string;
  accountNumber: string;
}

const getSmartCoverUrl = (pack: LessonPackData) => {
  if (pack.coverImage) {
    let baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, ''); 
    const cleanPath = pack.coverImage.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${baseUrl}/${cleanPath}`;
  }
  if (pack.videos && pack.videos.length > 0 && pack.videos[0].youtubeId) {
    return `https://img.youtube.com/vi/${pack.videos[0].youtubeId}/maxresdefault.jpg`;
  }
  return null;
};

export default function LessonPackPaymentPage() {
  const { id } = useParams<{ id: string }>(); // This is the Lesson Pack ID
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [packData, setPackData] = useState<LessonPackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"payhere" | "bank">("payhere");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Load Data ---
  useEffect(() => {
    if (!id || !user) return;

    const loadData = async () => {
      try {
        const data = await LessonPackService.getById(id);
        setPackData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load playlist details. It may be unavailable.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(price);

  // --- 2. Handle Payment ---
  const handlePayment = async () => {
      if (!packData || !user) return;
      setSubmitting(true);
      setError(null);

      try {
          // Call the specialized Lesson Pack enrollment endpoint we created earlier
          const enrollmentRes = await EnrollmentService.enrollInLessonPack(packData._id);
          
          // If the pack was free, the backend automatically grants access
          if (packData.price === 0) {
              navigate(`/student/lesson-packs/${packData._id}`);
              return;
          }

          const finalAmount = packData.price; 
          const enrollmentId = enrollmentRes.enrollment._id;

          if (paymentMethod === "bank") {
              navigate(`/student/payment/upload/${enrollmentId}`, {
                  state: { amount: finalAmount, targetMonth: "Lifetime Access" }
              });
          } else {
              const orderId = `${enrollmentId}_${Date.now()}`;
              const signature = await PaymentService.initiatePayHere(finalAmount, orderId);

              const params = {
                  merchant_id: signature.merchant_id,
                  return_url: `${window.location.origin}/student/lesson-packs/${packData._id}?payment=success`,
                  cancel_url: `${window.location.origin}/student/payment/lesson-pack/${id}?error=cancel`,
                  notify_url: `${NOTIFY_URL_BASE}/payments/payhere-webhook`,
                  order_id: orderId,
                  items: `Playlist: ${packData.title} [Lifetime]`,
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
                  custom_2: "Lifetime Access" 
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
          setError(err.response?.data?.message || err.message || "Payment processing failed.");
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
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
                <button onClick={() => navigate(-1)} className="group flex items-center text-sm font-bold text-gray-400 hover:text-brand-cerulean transition-colors mb-2 uppercase tracking-wider">
                    <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                <h1 className="text-3xl font-black text-brand-prussian tracking-tight">Unlock Playlist</h1>
                <p className="text-gray-500 font-medium">Securely purchase lifetime access to <span className="text-brand-cerulean font-bold">{packData?.title}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                <LockClosedIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">SSL Secured Checkout</span>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>{error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: Payment Selection */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Item Details */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden shadow-sm shrink-0 bg-gray-100 flex items-center justify-center">
                       {getSmartCoverUrl(packData!) ? (
                          <img src={getSmartCoverUrl(packData!)!} alt={packData?.title} className="w-full h-full object-cover" />
                       ) : (
                          <PlayCircleIcon className="w-10 h-10 text-gray-300" />
                       )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                       <span className="inline-block px-3 py-1 bg-brand-aliceBlue text-brand-cerulean text-[10px] font-bold uppercase tracking-widest rounded-md mb-2">Video Bundle</span>
                       <h2 className="text-xl font-bold text-brand-prussian mb-2">{packData?.title}</h2>
                       <p className="text-sm text-gray-500 mb-4">{packData?.description || "Comprehensive video lesson bundle."}</p>
                       <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">
                          ✓ Lifetime Access Included
                       </p>
                    </div>
                </div>

                {/* 2. Payment Method */}
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
                                <p className="text-[10px] text-gray-500 mt-1">Instant video activation via Card</p>
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
                        <div className="mt-6 space-y-4"> 
                            {BANK_OPTIONS.map((bank) => (
                                <div key={bank.id} className="p-5 sm:p-6 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs sm:text-sm font-bold text-gray-700">Transfer Information</p>
                                        <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                                            {bank.bankName} Account
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Number</p>
                                            <p className="font-mono font-bold text-brand-prussian text-base sm:text-lg tracking-wide">
                                                {bank.accountNumber}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Account Name</p>
                                            <p className="text-gray-700">{bank.accountName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Branch</p>
                                            <p className="text-gray-700">{bank.branch}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                            <span className="text-gray-500 font-medium">Access Type</span>
                            <span className="font-bold text-brand-prussian">Lifetime</span>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Video Bundle Fee</span>
                                <span className="font-bold text-gray-900">{formatPrice(packData?.price || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Payable</p>
                            <span className="text-2xl font-black text-brand-prussian tracking-tight">{formatPrice(packData?.price || 0)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={submitting}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm ${
                            submitting 
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
                                {paymentMethod === 'payhere' ? "Pay Securely" : "Confirm & Upload Slip"}
                                <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                            </>
                        )}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
                        <ShieldCheckIcon className="w-3 h-3" /> Guaranteed Instant Access
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}