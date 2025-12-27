import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { z } from "zod"; // Import Zod
import ResendVerificationModal from "../components/modals/ResendVerification";

// --- 1. SECURITY VALIDATION SCHEMA ---
const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .refine((val) => val.endsWith("@gmail.com"), {
      message: "Please log in with your Gmail account"
    }),
  password: z.string().min(1, "Password is required"),
});
// --- BACKGROUND COMPONENT (Visuals) ---
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

// --- REUSABLE INPUT COMPONENT (Cleaner Code) ---
const InputField = ({ 
  label, name, type = "text", value, onChange, icon: Icon, placeholder, error, rightElement 
}: any) => (
  <div className="space-y-2">
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

// --- MAIN LOGIN COMPONENT ---
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // State
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field errors on type
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

    // 1. Zod Validation (Client Side)
    const validationResult = loginSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach(issue => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    // 2. Data Sanitization (Safe Parse Result contains cleaned data)
    const { email, password } = validationResult.data;

    setIsSubmitting(true);

    try {
      // 3. Perform Login
      await login({ email, password });

      // 4. Role Check & Navigation
      const res = await api.get("/auth/me");
      const role = res.data?.user?.role;
      
      // Optional: Handle 'Remember Me' logic here (e.g., persist token to localStorage vs sessionStorage)
      
      navigate(role === "admin" ? "/admin/dashboard" : "/student/dashboard");

    } catch (err: any) {
      console.error("Login Error:", err);
      const msg = err.message || "Failed to login.";
      const status = err.response?.status;
      const responseMsg = err.response?.data?.message || "";

      // 5. Intelligent Error Handling
      if (status === 403 && (responseMsg.includes("verify") || responseMsg.includes("active"))) {
        setIsVerifyModalOpen(true);
        setGeneralError("Your account is not verified yet.");
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
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center md:justify-start pt-12 md:pt-0">
      
      <BackgroundGradient />

      <ResendVerificationModal 
        isOpen={isVerifyModalOpen} 
        onClose={() => setIsVerifyModalOpen(false)} 
        emailHint={formData.email} // Pass email to modal to pre-fill if needed
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#053A4E]/10 max-w-md w-full mx-auto md:mx-0 mt-0 md:mt-20"
        >
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">ආයුබෝවන්!</h2>
            <p className="text-gray-500 mt-2 font-sans">Welcome back to SL Accounting LMS</p>
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

          <form onSubmit={handleLogin} className="space-y-6">
            
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
                  className="text-gray-400 hover:text-[#053A4E] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
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
              className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Login to LMS <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8 space-y-3 text-center text-sm text-gray-500">
            <div>
              Don't have an account? <Link to="/register" className="text-[#05668A] font-bold hover:underline">Register Now</Link>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Visual Text (Desktop Only) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block text-right"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 mb-6">
            <ShieldCheck className="text-[#05668A]" size={20} />
            <span className="text-[#053A4E] font-bold text-sm">Secure Student Portal</span>
          </div>
          <h1 className="text-6xl font-black text-[#053A4E] mb-4 font-sinhala leading-tight">
            ඔබේ ජයග්‍රහණයේ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#05668A] to-[#EF8D8E]">ආරම්භය මෙතැනයි</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-md ml-auto font-sinhala leading-relaxed">
            Access your course materials, recordings, and exam papers in one secure place.
          </p>

          <div className="mt-8 flex justify-end gap-3 opacity-60">
              <div className="w-12 h-1 bg-[#053A4E] rounded-full"></div>
              <div className="w-6 h-1 bg-[#EF8D8E] rounded-full"></div>
              <div className="w-3 h-1 bg-[#FFE787] rounded-full"></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}