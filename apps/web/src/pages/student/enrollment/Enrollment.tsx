import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClassService from "../../../services/ClassService";
import EnrollmentService from "../../../services/EnrollmentService";
import PaymentService from "../../../services/PaymentService";
import { useAuth } from "../../../contexts/AuthContext"; // Adjust path if needed
import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  UserIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

// --- Configuration ---
const PAYHERE_URL = "https://sandbox.payhere.lk/pay/checkout"; 

const BANK_DETAILS = {
  bankName: "Commercial Bank",
  branch: "Colombo 07",
  accountName: "SL Accounting Institute",
  accountNumber: "1234-5678-9012",
};

// --- Interfaces ---
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
  
  const { user, loading: authLoading } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"payhere" | "bank">("payhere");
  const [error, setError] = useState<string | null>(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        navigate("/login", { state: { from: `/student/enrollment/${id}` } });
        return;
    }

    const fetchData = async () => {
      if (!id) return;
      try {
        // --- CHANGE: Removed enrollment check here so page always loads ---
        
        const data = await ClassService.getPublicClassById(id);
        setClassData(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        console.error(err);
        setError("Unable to load class details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, authLoading, navigate]);


  // --- 2. Handle Enrollment & Payment ---
  const handleProcess = async () => {
    if (!id || !classData || !user) return;
    
    setSubmitting(true);

    try {
      // Step A: Create or Retrieve Enrollment
      let enrollment;
      try {
          // Attempt to create new enrollment
          enrollment = await EnrollmentService.enrollInClass(id, user._id);
      } catch (e: any) {
          // --- LOGIC UPDATE: Handle "Already Enrolled" by proceeding to payment ---
          if (typeof e === 'string' && e.includes("already enrolled")) {
             console.log("User already enrolled, fetching existing record...");
             
             // Fetch user's enrollments to find the existing one for this class
             const myEnrollments = await EnrollmentService.getMyEnrollments();
             const existing = myEnrollments.find((en: any) => {
                // Handle populated vs unpopulated class ID
                const enClassId = typeof en.class === 'string' ? en.class : en.class._id;
                return enClassId === id;
             });

             if (existing) {
                 enrollment = existing;
                 // Continue flow to payment...
             } else {
                 alert("Error retrieving enrollment details. Please contact support.");
                 setSubmitting(false);
                 return;
             }
          } else {
             throw e; // Stop if it's a different error
          }
      }
      
      const enrollmentId = enrollment._id;

      // Step B: Route based on Payment Method
      if (paymentMethod === "bank") {
          // Bank Transfer Logic
          alert("Enrollment Recorded! Please upload your bank transfer slip in the dashboard.");
          navigate("/student/dashboard");
      } 
      
      else if (paymentMethod === "payhere") {
          // PayHere Logic
          
          // 1. Generate unique Order ID
          const orderId = `${enrollmentId}_${Date.now()}`;

          // 2. Get Hash from Backend
          const signatureData = await PaymentService.initiatePayHere(classData.price, orderId);

          // 3. Prepare PayHere Form Data
          const payHereParams = {
              merchant_id: signatureData.merchant_id,
              return_url: `${window.location.origin}/student/dashboard?payment=success`,
              cancel_url: `${window.location.origin}/student/enrollment/${id}?payment=cancel`,
              notify_url: "http://your-backend-domain.com/api/v1/payments/payhere-webhook", // Replace with your Public URL
              
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

          // 4. Create and Submit Hidden Form
          const form = document.createElement("form");
          form.setAttribute("method", "POST");
          form.setAttribute("action", PAYHERE_URL);

          Object.keys(payHereParams).forEach(key => {
              const input = document.createElement("input");
              input.setAttribute("type", "hidden");
              input.setAttribute("name", key);
              input.setAttribute("value", (payHereParams as any)[key]);
              form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
      }

    } catch (err: any) {
      console.error(err);
      alert(err.message || err || "Process failed. Please try again.");
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(price);

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading checkout...</div>;
  if (error || !classData) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-[#0b2540] mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Details & Method */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Class Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex gap-6 border border-gray-100">
               <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                  {classData.coverImage ? (
                      <img src={classData.coverImage} className="w-full h-full object-cover" alt="Class" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                  )}
               </div>
               <div>
                  <h2 className="text-xl font-bold text-gray-900">{classData.name}</h2>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                     <CalendarDaysIcon className="w-4 h-4" /> Monthly Subscription
                  </div>
                  <div className="mt-2 text-xl font-bold text-[#0b2540]">{formatPrice(classData.price)}</div>
               </div>
            </div>

            {/* Student Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <UserIcon className="w-5 h-5 text-gray-400" /> Student Info
               </h3>
               <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                        {user ? `${user.firstName} ${user.lastName}` : "Student"}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                    <ShieldCheckIcon className="w-3 h-3" /> Verified
                  </span>
               </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Option 1: PayHere */}
                  <div 
                    onClick={() => setPaymentMethod("payhere")}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all ${
                        paymentMethod === "payhere" ? "border-[#0b2540] bg-blue-50/30" : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "payhere" ? "border-[#0b2540]" : "border-gray-300"}`}>
                          {paymentMethod === "payhere" && <div className="w-2.5 h-2.5 rounded-full bg-[#0b2540]" />}
                      </div>
                      <div>
                          <p className="font-bold text-gray-900">Pay Online</p>
                          <p className="text-xs text-gray-500">Card / Wallet</p>
                      </div>
                      <CreditCardIcon className="w-6 h-6 text-gray-400 ml-auto" />
                  </div>

                  {/* Option 2: Bank Transfer */}
                  <div 
                    onClick={() => setPaymentMethod("bank")}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all ${
                        paymentMethod === "bank" ? "border-[#0b2540] bg-blue-50/30" : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "bank" ? "border-[#0b2540]" : "border-gray-300"}`}>
                          {paymentMethod === "bank" && <div className="w-2.5 h-2.5 rounded-full bg-[#0b2540]" />}
                      </div>
                      <div>
                          <p className="font-bold text-gray-900">Bank Transfer</p>
                          <p className="text-xs text-gray-500">Upload Slip</p>
                      </div>
                      <BuildingLibraryIcon className="w-6 h-6 text-gray-400 ml-auto" />
                  </div>

               </div>

               {/* Conditional Bank Details */}
               {paymentMethod === "bank" && (
                   <div className="mt-6 p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50 animate-fade-in">
                      <p className="text-sm text-gray-600 mb-3 font-medium">Bank Details for Transfer:</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-gray-500">Bank:</span> <span className="font-semibold">{BANK_DETAILS.bankName}</span>
                          <span className="text-gray-500">Account No:</span> <span className="font-mono font-bold">{BANK_DETAILS.accountNumber}</span>
                          <span className="text-gray-500">Branch:</span> <span>{BANK_DETAILS.branch}</span>
                          <span className="text-gray-500">Name:</span> <span>{BANK_DETAILS.accountName}</span>
                      </div>
                   </div>
               )}
            </div>
          </div>

          {/* RIGHT: Total & Action */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                   <div className="flex justify-between text-sm text-gray-600">
                      <span>Class Fee</span>
                      <span>{formatPrice(classData.price)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-gray-600">
                      <span>Registration</span>
                      <span className="text-green-600 font-medium">Free</span>
                   </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                   <span className="text-gray-600">Total</span>
                   <span className="text-3xl font-bold text-[#0b2540]">{formatPrice(classData.price)}</span>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={submitting}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-blue-900/10 transition-all ${
                    submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#0b2540] hover:bg-[#153454]"
                  }`}
                >
                  {submitting 
                    ? "Processing..." 
                    : paymentMethod === "payhere" ? "Pay Now" : "Confirm Enrollment"
                  }
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                  Secure payment processed by PayHere.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}