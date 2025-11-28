import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

// --- BRAND CONSTANTS ---
const BRAND = {
  prussian: "#053A4E",
  cerulean: "#05668A",
  coral: "#EF8D8E",
  jasmine: "#FFE787",
  alice: "#E8EFF7",
};

// --- BACKGROUND COMPONENT (Framer Motion) ---
// Matching the Register page background for consistency
const BackgroundGradient = () => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#E8EFF7]">
    {/* Animated Blobs */}
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        rotate: [0, 90, 0]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#05668A] rounded-full mix-blend-multiply filter blur-[128px] opacity-30" 
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        x: [0, 50, 0],
        y: [0, 30, 0]
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-[#EF8D8E] rounded-full mix-blend-multiply filter blur-[128px] opacity-30" 
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.3, 1],
        x: [0, -30, 0],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-[#FFE787] rounded-full mix-blend-multiply filter blur-[128px] opacity-40" 
    />
  </div>
);

// --- LOGIN FORM COMPONENT ---
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login delay
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center md:justify-start pt-12 md:pt-0">
      
      {/* Static Animated Background */}
      <BackgroundGradient />

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#053A4E]/10 max-w-md w-full mx-auto md:mx-0 mt-0 md:mt-20"
        >
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">ආයුබෝවන්!</h2>
            <p className="text-gray-500 mt-2 font-sans">Welcome back to SL Accounting LMS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#053A4E] ml-1">Student ID / Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter your ID"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-4 rounded-2xl outline-none transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#053A4E] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-12 py-4 rounded-2xl outline-none transition-all shadow-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#053A4E] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-[#053A4E]">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#05668A] focus:ring-[#05668A]" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-[#05668A] font-bold hover:text-[#EF8D8E] transition-colors">Forgot Password?</a>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Login to LMS <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-[#05668A] font-bold hover:underline">Register Now</Link>
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

          {/* Optional: Add a subtle static graphic or icons here if desired */}
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