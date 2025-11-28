import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 2000);
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      
      {/* Static Animated Background */}
      <BackgroundGradient />

      {/* Card Container */}
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

        {!isSubmitted ? (
          <>
            <div className="text-center mt-6 mb-8">
              <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">මුරපදය අමතකද?</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Don't worry! Enter your email or Student ID and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#053A4E] ml-1">Email Address / Student ID</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter your email or ID"
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
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
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
            <h3 className="text-2xl font-bold text-[#053A4E] mb-2">Check your Email</h3>
            <p className="text-gray-500 mb-8">
              We have sent a password reset link to <span className="font-bold text-[#05668A]">{email}</span>.
            </p>
            <button 
              onClick={() => setIsSubmitted(false)}
              className="text-[#05668A] font-bold hover:underline text-sm"
            >
              Try with another email
            </button>
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-[#053A4E] transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

      </motion.div>
    </div>
  );
}