import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Hash, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import UserService from "../services/UserService.ts";

// --- 1. VALIDATION SCHEMAS ---

// Step 1: Email Validation
const emailSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .refine((val) => val.endsWith("@gmail.com"), {
      message: "Only Gmail addresses are allowed",
    }),
});

// Step 2: Reset Validation (Strong Password & OTP)
const resetSchema = z.object({
  otp: z.string().trim().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numeric"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// --- 2. REUSABLE COMPONENTS ---

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
  </div>
);

const InputField = ({ label, name, type = "text", value, onChange, icon: Icon, placeholder, error, maxLength, rightElement }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-[#053A4E] ml-1">{label}</label>
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-500" : "text-[#05668A] group-focus-within:text-[#EF8D8E]"}`}>
        <Icon size={20} />
      </div>
      <input 
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full bg-white/50 border ${error ? "border-red-400 focus:border-red-500" : "border-white/50 focus:border-[#05668A]"} focus:bg-white text-[#053A4E] pl-12 pr-${rightElement ? "12" : "4"} py-4 rounded-2xl outline-none transition-all shadow-sm`}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs ml-1 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
  </div>
);

// --- 3. MAIN COMPONENT ---

export default function ForgotPassword() {
  
  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  // STEP 1 SUBMIT
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    // Validate
    const result = emailSchema.safeParse({ email: formData.email });
    if (!result.success) {
      setErrors({ email: result.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      await UserService.forgetUserPassword(result.data.email);
      setStep(2); 
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Could not send OTP. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 SUBMIT
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    // Validate
    const result = resetSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await UserService.resetUserPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      setStep(3);
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Invalid OTP or failed to reset password.");
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

        {/* --- API ERROR ALERT --- */}
        <AnimatePresence>
          {apiError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6 border border-red-100"
            >
              <AlertCircle size={16} className="shrink-0" />
              {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= STEP 1: EMAIL ================= */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mt-6 mb-8">
              <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">මුරපදය අමතකද?</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Enter your registered email address. We will send you a 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-6">
              <InputField 
                label="Email Address" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                icon={Mail} 
                placeholder="Enter your email" 
                error={errors.email}
              />

              <button 
                disabled={loading}
                className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Code"}
              </button>
            </form>
          </motion.div>
        )}

        {/* ================= STEP 2: OTP & NEW PASS ================= */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mt-6 mb-6">
              <h2 className="text-2xl font-bold text-[#053A4E]">Reset Password</h2>
              <p className="text-brand-coral mt-2 text-xs">
                
                If account exists, reset code sent to <span className="font-semibold text-[#05668A]">{formData.email}</span> <br/> or sent to user's phone number
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              
              <InputField 
                label="6-Digit Code" 
                name="otp" 
                value={formData.otp} 
                onChange={(e: any) => {
                    // Only allow numbers
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 6) handleChange(e);
                }} 
                icon={Hash} 
                placeholder="123456" 
                error={errors.otp}
                maxLength={6}
              />

              <InputField 
                label="New Password" 
                name="newPassword" 
                type={showPassword ? "text" : "password"} 
                value={formData.newPassword} 
                onChange={handleChange} 
                icon={Lock} 
                placeholder="Strong Password" 
                error={errors.newPassword}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#053A4E]">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />

              <InputField 
                label="Confirm Password" 
                name="confirmPassword" 
                type={showPassword ? "text" : "password"} 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                icon={Lock} 
                placeholder="Re-enter Password" 
                error={errors.confirmPassword}
              />

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
                className="w-full text-center text-sm text-gray-500 hover:text-[#053A4E] mt-2 underline decoration-transparent hover:decoration-[#053A4E] transition-all"
              >
                Change Email Address
              </button>
            </form>
          </motion.div>
        )}

        {/* ================= STEP 3: SUCCESS ================= */}
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