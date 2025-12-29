import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { z } from "zod";
import ResendVerificationModal from "../components/modals/ResendVerification";

// --- 1. SECURITY SCHEMA ---
const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// --- 2. OPTIMIZED BACKGROUND (Fixes Mobile Lag) ---
// Using React.memo prevents re-renders when typing in inputs
const BackgroundGradient = memo(() => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#E8EFF7]">
    {/* Blob 1 */}
    <motion.div 
      initial={{ opacity: 0.3, scale: 1 }}
      animate={{ 
        scale: [1, 1.1, 1], 
        rotate: [0, 45, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] right-[-5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#05668A] rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] opacity-20 will-change-transform" 
    />
    {/* Blob 2 */}
    <motion.div 
      initial={{ opacity: 0.3 }}
      animate={{ 
        x: [0, 30, 0], 
        y: [0, 20, 0] 
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] left-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#EF8D8E] rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] opacity-20 will-change-transform" 
    />
    {/* Blob 3 */}
    <motion.div 
      initial={{ opacity: 0.4 }}
      animate={{ x: [0, -20, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] right-[10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#FFE787] rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] opacity-30 will-change-transform" 
    />
  </div>
));

// --- REUSABLE INPUT ---
const InputField = ({ 
  label, name, type = "text", value, onChange, icon: Icon, placeholder, error, rightElement 
}: any) => (
  <div className="space-y-1.5 sm:space-y-2">
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
        // Removed heavy backdrop blur from input itself for performance
        className={`w-full bg-white/60 border ${error ? "border-red-400 focus:border-red-500" : "border-white focus:border-[#05668A]"} focus:bg-white text-[#053A4E] pl-12 pr-${rightElement ? "12" : "4"} py-3.5 sm:py-4 rounded-xl sm:rounded-2xl outline-none transition-all shadow-sm`}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs ml-1 flex items-center gap-1 animate-fade-in"><AlertCircle size={12} /> {error}</p>}
  </div>
);

// --- MAIN LOGIN ---
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const validationResult = loginSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    const { email, password } = validationResult.data;
    setIsSubmitting(true);

    try {
      await login({ email, password });
      
      // Fetch role for redirect
      try {
          const res = await api.get("/auth/me");
          const role = res.data?.user?.role;
          navigate(role === "admin" ? "/admin/dashboard" : "/student/dashboard");
      } catch (meError) {
          // Fallback if /me fails but login succeeded
          navigate("/student/dashboard"); 
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      
      const status =  err.response?.status;
      const responseMsg = (err.response?.data?.message || "").toLowerCase();
      const msg = err.message || "Failed to login.";

      console.log("Status:", status, "Response Msg:", responseMsg);
      console.log("General Error Msg:", msg);
      

      // --- FIXED: Robust check for unverified account ---
      // Many backends return 403 or 401 with a specific message for unverified accounts
      if (status === 403 && (responseMsg.includes("verify") || responseMsg.includes("active") || responseMsg.includes("verified"))) {
        setIsVerifyModalOpen(true); // Open the modal
        setGeneralError("Your account is not verified yet. Please check your email.");
      } else if (status === 401) {
        setGeneralError("Invalid email or password.");
      } else {
        setGeneralError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center md:justify-start pt-6 sm:pt-12 md:pt-0 bg-[#E8EFF7]">
      
      {/* Optimized Background */}
      <BackgroundGradient />

      {/* Verification Modal */}
      <ResendVerificationModal 
        isOpen={isVerifyModalOpen} 
        onClose={() => setIsVerifyModalOpen(false)} 
        emailHint={formData.email} 
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        
        {/* Left Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-md border border-white p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-[#053A4E]/5 max-w-md w-full mx-auto md:mx-0 mt-4 md:mt-20"
        >
          <div className="mb-6 sm:mb-8 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#053A4E] font-sinhala">ආයුබෝවන්!</h2>
            <p className="text-gray-500 mt-2 font-sans text-sm sm:text-base">Welcome back to SL Accounting LMS</p>
          </div>

          {generalError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3"
            >
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-600 font-medium">{generalError}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            
            <InputField 
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              icon={User}
              placeholder="Enter your email"
              error={fieldErrors.email}
            />

            <InputField 
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
              placeholder="••••••••"
              error={fieldErrors.password}
              rightElement={
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-[#053A4E] transition-colors focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-[#053A4E] select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#05668A] focus:ring-[#05668A]" 
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-[#05668A] font-bold hover:text-[#EF8D8E] transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Login to LMS <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-[#05668A] font-bold hover:underline">Register Now</Link>
          </div>
        </motion.div>

        {/* Right Side: Visual Text (Hidden on Mobile for performance/space) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block text-right"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/40 mb-6 shadow-sm">
            <ShieldCheck className="text-[#05668A]" size={20} />
            <span className="text-[#053A4E] font-bold text-sm">Secure Student Portal</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-[#053A4E] mb-4 font-sinhala leading-tight drop-shadow-sm">
            ඔබේ ජයග්‍රහණයේ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#05668A] to-[#EF8D8E]">ආරම්භය මෙතැනයි</span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-500 max-w-md ml-auto font-sinhala leading-relaxed">
            Access your course materials, recordings, and exam papers in one secure place.
          </p>

          <div className="mt-10 flex justify-end gap-3 opacity-60">
              <div className="w-16 h-1.5 bg-[#053A4E] rounded-full"></div>
              <div className="w-8 h-1.5 bg-[#EF8D8E] rounded-full"></div>
              <div className="w-4 h-1.5 bg-[#FFE787] rounded-full"></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}