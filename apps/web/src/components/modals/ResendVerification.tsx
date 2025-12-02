import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
// 1. Import your UserService
import UserService from "../../services/userService"; // Adjust the import path as needed
import { useNavigate } from "react-router-dom";

interface ResendVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResendVerificationModal({ isOpen, onClose }: ResendVerificationModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      // 2. Call the actual API endpoint
      await UserService.resendVerificationOtp(email);
      setStatus("success");
      setTimeout(() => {
        navigate("/verification", { state: { email: email } });
      }, 1400);
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      setStatus("error");
      
      // 3. Extract specific backend error message if available
      // (Axios stores backend response data in error.response.data)
      const backendMessage = error.response?.data?.message;
      setErrorMessage(backendMessage || error.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setEmail("");
      setErrorMessage("");
    }
  }, [isOpen]);

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
            {/* Modal Content */}
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
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#E8EFF7] rounded-full flex items-center justify-center mx-auto mb-4 text-[#05668A]">
                    <Mail size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-[#053A4E]">Verify Account</h3>
                  <p className="text-gray-500 mt-2 text-sm">
                    Enter your email address and we'll send you a new verification code.
                  </p>
                </div>

                {/* Success View */}
                {status === "success" ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4"
                  >
                    <div className="flex flex-col items-center gap-3 text-green-600 mb-6">
                      <CheckCircle size={48} />
                      <span className="font-bold text-lg">Code Sent!</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      We sent a verification code to <strong>{email}</strong>. Please check your inbox.
                    </p>
                    
                  </motion.div>
                ) : (
                  /* Form View */
                  <form onSubmit={handleResend} className="space-y-5">
                    
                    {/* Error Alert */}
                    {status === "error" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm"
                      >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#053A4E] ml-1">Email Address</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                          <Mail size={20} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full bg-gray-50 border border-gray-100 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#053A4E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          Send Code <Send size={18} />
                        </>
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