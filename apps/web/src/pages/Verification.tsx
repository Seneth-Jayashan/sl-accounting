import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/userService";

// --- BACKGROUND COMPONENT ---
const BackgroundGradient = () => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#E8EFF7]">
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#05668A] rounded-full mix-blend-multiply filter blur-[128px] opacity-30" 
    />
    <motion.div 
      animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, 30, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-[#EF8D8E] rounded-full mix-blend-multiply filter blur-[128px] opacity-30" 
    />
    <motion.div 
      animate={{ scale: [1, 1.3, 1], x: [0, -30, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-[#FFE787] rounded-full mix-blend-multiply filter blur-[128px] opacity-40" 
    />
  </div>
);

export default function Verification() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Get Email from Navigation State
  const email = location.state?.email;

  // 2. Redirect if no email (security/fallback)
  useEffect(() => {
    if (!email) {
      // If user refreshes or accesses direct, they lose state. Redirect to login.
      navigate("/login");
    }
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.every(char => !isNaN(Number(char)))) {
      const newCode = [...code];
      pastedData.forEach((char, index) => {
        if (index < 6) newCode[index] = char;
      });
      setCode(newCode);
      const lastIndex = Math.min(pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  // 3. Handle Actual Verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const verificationCode = code.join("");
    
    try {
      if (!email) throw new Error("Email not found. Please register again.");

      // Call UserService
      const response = await UserService.verifyUserEmail({
        email: email,
        otpCode: verificationCode
      });

      if (response.success) {
        setIsVerified(true);
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (err: any) {
       // Extract error message
       const msg = err.response?.data?.message || err.message || "Verification failed";
       setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Resend OTP
  const handleResend = async () => {
    setResendStatus(null);
    setError(null);
    try {
      if (!email) return;
      
      const response = await UserService.resendVerificationOtp(email);
      if (response.success) {
        setResendStatus("Code resent successfully!");
      }
    } catch (err: any) {
       const msg = err.response?.data?.message || "Failed to resend code";
       setError(msg);
    }
  };

  if (!email) return null; // Don't render if redirecting

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <BackgroundGradient />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#053A4E]/10 w-full max-w-lg relative mt-0 md:mt-20"
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-white/50 -rotate-6">
           <ShieldCheck size={32} className="text-[#05668A]" />
        </div>

        {!isVerified ? (
          <>
            <div className="text-center mt-6 mb-8">
              <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">ගිණුම තහවුරු කරන්න</h2>
              <p className="text-gray-500 mt-2 text-sm">
                We've sent a 6-digit verification code to <span className="font-bold text-[#053A4E]">{email}</span>. Please enter it below.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
              
              {/* Error / Success Messages */}
              {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm text-center">{error}</div>}
              {resendStatus && <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm text-center">{resendStatus}</div>}

              <div className="flex justify-center gap-2 md:gap-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-10 h-12 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold text-[#053A4E] bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white rounded-xl outline-none transition-all shadow-sm focus:scale-105"
                    required
                  />
                ))}
              </div>

              <button 
                disabled={loading || code.some(c => c === "")}
                className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify Account <ArrowRight size={20} /></>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
              <button 
                onClick={handleResend}
                className="inline-flex items-center gap-2 text-[#05668A] font-bold hover:text-[#EF8D8E] transition-colors text-sm group"
              >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
                Resend Code
              </button>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-6 py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-[#053A4E] mb-2">Verification Successful!</h3>
            <p className="text-gray-500 mb-8">
              Your account has been successfully verified. You can now access the LMS.
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all w-full"
            >
              Continue to Login <ArrowRight size={20} />
            </Link>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}