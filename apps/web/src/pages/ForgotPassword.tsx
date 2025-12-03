import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Hash, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import UserService from "../services/userService"; 

// --- BRAND CONSTANTS ---
const BRAND = {
  prussian: "#053A4E",
  cerulean: "#05668A",
  coral: "#EF8D8E",
  jasmine: "#FFE787",
  alice: "#E8EFF7",
};

// --- BACKGROUND COMPONENT ---
const BackgroundGradient = () => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#E8EFF7]">
    {/* Animated Blobs */}
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // State Management
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP/Pass, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // STEP 1: Send OTP to Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await UserService.forgetUserPassword(email);
      setStep(2); // Move to next step
    } catch (err: any) {
      console.error("OTP Request error:", err);
      setError(err.response?.data?.message || "Could not send OTP. Check your email/ID.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      await UserService.resetUserPassword({
        email,
        otp,
        newPassword
      });
      setStep(3); // Move to success step
    } catch (err: any) {
      console.error("Reset Password error:", err);
      setError(err.response?.data?.message || "Invalid OTP or failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <BackgroundGradient />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#053A4E]/10 w-full max-w-lg relative mt-0 md:mt-20"
      >
        {/* Decorative Icon */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-white/50 rotate-12">
           <KeyRound size={32} className="text-[#05668A]" />
        </div>

        {/* --- ERROR MESSAGE --- */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {/* =========================================================
            STEP 1: ENTER EMAIL
           ========================================================= */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mt-6 mb-8">
              <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">මුරපදය අමතකද?</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Enter your registered email address. We will send you a 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#053A4E] ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-4 rounded-2xl outline-none transition-all shadow-sm"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Code"}
              </button>
            </form>
          </motion.div>
        )}

        {/* =========================================================
            STEP 2: ENTER OTP & NEW PASSWORD
           ========================================================= */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mt-6 mb-6">
              <h2 className="text-2xl font-bold text-[#053A4E]">Reset Password</h2>
              <p className="text-gray-500 mt-2 text-xs">
                Code sent to <span className="font-semibold text-[#05668A]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* OTP Input */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#053A4E] ml-1">6-Digit Code</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A]">
                    <Hash size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-4 rounded-2xl outline-none transition-all shadow-sm tracking-widest font-mono text-lg"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#053A4E] ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A]">
                    <Lock size={20} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="New Password"
                    className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-4 rounded-2xl outline-none transition-all shadow-sm"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#053A4E] ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A]">
                    <Lock size={20} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Confirm New Password"
                    className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-4 rounded-2xl outline-none transition-all shadow-sm"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  disabled={loading}
                  className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Change Password"}
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-center text-sm text-gray-500 hover:text-[#053A4E] mt-2"
              >
                Change Email
              </button>
            </form>
          </motion.div>
        )}

        {/* =========================================================
            STEP 3: SUCCESS
           ========================================================= */}
        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-6 py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-[#053A4E] mb-2">Password Reset!</h3>
            <p className="text-gray-500 mb-8">
              Your password has been successfully updated. You can now login with your new password.
            </p>
            <Link 
              to="/login"
              className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all inline-block"
            >
              Back to Login
            </Link>
          </motion.div>
        )}

        {/* Footer Link (Only for Step 1 & 2) */}
        {step !== 3 && (
          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-[#053A4E] transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        )}

      </motion.div>
    </div>
  );
}