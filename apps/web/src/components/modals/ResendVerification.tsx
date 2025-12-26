import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import UserService from "../../services/UserService.ts"; 

// --- 1. PROPS INTERFACE ---
interface ResendVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailHint?: string; // New: Accept email from Login form to auto-fill
}

// --- 2. VALIDATION SCHEMA ---
const emailSchema = z.string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .trim()
  .toLowerCase()
  .refine((val) => val.endsWith("@gmail.com"), {
    message: "Only Gmail addresses are allowed",
  });

export default function ResendVerificationModal({ 
  isOpen, 
  onClose, 
  emailHint = "" 
}: ResendVerificationModalProps) {
  
  const navigate = useNavigate();

  // --- STATE ---
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // separate errors for field validation (UI) vs API (Alert)
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- EFFECT: RESET & PRE-FILL ---
  useEffect(() => {
    if (isOpen) {
      setEmail(emailHint);
      setIsSuccess(false);
      setValidationError(null);
      setApiError(null);
      setIsLoading(false);
    }
  }, [isOpen, emailHint]);

  // --- HANDLER ---
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setValidationError(null);
    setApiError(null);

    // 1. Zod Validation
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    const validEmail = result.data; // Sanitized data

    setIsLoading(true);

    try {
      // 2. API Call
      await UserService.resendVerificationOtp(validEmail);
      
      // 3. Success State
      setIsSuccess(true);
      
      // 4. Navigate after delay
      setTimeout(() => {
        onClose(); // Close modal first (optional)
        navigate("/verification", { state: { email: validEmail } });
      }, 1500);

    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      
      const backendMessage = error.response?.data?.message 
        || error.message 
        || "Failed to send verification code.";
      
      setApiError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear validation error as user types
    if (validationError) setValidationError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#053A4E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                
                {/* Header Section */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${isSuccess ? "bg-green-100 text-green-600" : "bg-[#E8EFF7] text-[#05668A]"}`}>
                    {isSuccess ? <CheckCircle size={32} /> : <Mail size={32} />}
                  </div>
                  <h3 className="text-2xl font-bold text-[#053A4E]">
                    {isSuccess ? "Check Your Inbox" : "Verify Account"}
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm">
                    {isSuccess 
                      ? `We sent a code to ${email}`
                      : "Enter your email address to receive a new verification code."}
                  </p>
                </div>

                {/* --- SUCCESS VIEW --- */}
                {isSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center pb-4"
                  >
                    <Loader2 size={24} className="animate-spin text-[#05668A] mb-2" />
                    <span className="text-xs text-gray-400">Redirecting to verification...</span>
                  </motion.div>
                ) : (
                  
                  /* --- FORM VIEW --- */
                  <form onSubmit={handleResend} className="space-y-5">
                    
                    {/* API Error Alert */}
                    {apiError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm"
                      >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{apiError}</span>
                      </motion.div>
                    )}

                    {/* Input Field */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#053A4E] ml-1">Email Address</label>
                      <div className="relative group">
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${validationError ? "text-red-500" : "text-[#05668A] group-focus-within:text-[#EF8D8E]"}`}>
                          <Mail size={20} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={handleInput}
                          placeholder="Enter your email"
                          className={`w-full bg-gray-50 border ${validationError ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-100 focus:border-[#05668A] focus:bg-white"} text-[#053A4E] pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all shadow-sm`}
                        />
                      </div>
                      {/* Validation Error Text */}
                      {validationError && (
                        <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {validationError}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#053A4E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>Send Code <Send size={18} /></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}