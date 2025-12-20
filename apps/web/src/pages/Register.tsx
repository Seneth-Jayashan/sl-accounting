import React, { useState, useEffect } from "react"; // Added useEffect
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BatchService from "../services/BatchService"; // Import BatchService
import type { BatchData } from "../services/BatchService"; // Import BatchService


// --- BACKGROUND COMPONENT (Unchanged) ---
const BackgroundGradient = () => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#E8EFF7]">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        rotate: [0, 90, 0],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#05668A] rounded-full mix-blend-multiply filter blur-[128px] opacity-30"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        x: [0, 50, 0],
        y: [0, 30, 0],
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

// --- REGISTER FORM COMPONENT ---
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- NEW: Batches State ---
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    batch: "",
    password: "",
    confirmPassword: "",
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // --- NEW: Fetch Batches on Mount ---
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await BatchService.getAllPublicBatches();
        console.log("Fetched batches:", data);
        // Assuming backend returns array directly or inside .data
        const batchList = Array.isArray(data.batches) ? data.batches : (data as any).data || [];
        setBatches(batchList);
      } catch (err) {
        console.error("Failed to fetch batches", err);
        // Optional: Set a default or show error, but usually we just let the dropdown be empty
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProfileFile(file);
  };

  const validate = () => {
    setError(null);
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.phoneNumber.trim()) return "Phone number is required";
    if (!formData.batch) return "Please select your A/L batch";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    
    const phoneNormalized = formData.phoneNumber.replace(/\s+/g, "");
    if (!/^[0-9+()-]{6,15}$/.test(phoneNormalized)) return "Enter a valid phone number";
    
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim(),
        batch: formData.batch, // This will now send the Batch ID
        profileImageFile: profileFile,
      });

      setSuccessMsg("Registration successful. Check your email to verify your account.");
      
      const registeredEmail = formData.email.trim();

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        batch: "",
        password: "",
        confirmPassword: "",
      });
      setProfileFile(null);

      setTimeout(() => {
        navigate("/verification", { state: { email: registeredEmail } });
      }, 1400);

    } catch (err: any) {
      const msg = err?.message ?? (typeof err === "string" ? err : "Registration failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-y-auto overflow-x-hidden flex items-center justify-center md:justify-end pt-24 pb-12">
      <BackgroundGradient />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start md:items-center">
        {/* Left Side Content - Unchanged */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block text-left sticky top-32"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 mb-6 shadow-sm">
            <CheckCircle2 className="text-[#EF8D8E]" size={20} />
            <span className="text-[#053A4E] font-bold text-sm">Join 1000+ Students</span>
          </div>
          <h1 className="text-6xl font-black text-[#053A4E] mb-4 font-sinhala leading-tight drop-shadow-sm">
            අනාගතය දිනන <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EF8D8E] to-[#05668A]">
              පවුලට එක්වන්න
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-lg font-sinhala leading-relaxed">
            Create your student account today to access exclusive A/L Accounting tutorials, exams, and live sessions.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"
                  style={{
                    backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`,
                    backgroundSize: "cover",
                  }}
                />
              ))}
            </div>
            <div className="text-sm font-medium text-[#053A4E]">
              <span className="font-bold block">Trusted Community</span>
              Join your friends today
            </div>
          </div>
        </motion.div>

        {/* Right Side Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full max-w-xl mx-auto md:mx-0 mt-4 md:mt-12"
        >
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#053A4E]">Register</h2>
            <p className="text-gray-500 text-sm mt-1">Create your new student account</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
            {successMsg && <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">{successMsg}</div>}

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">First Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input name="firstName" value={formData.firstName} onChange={handleChange} type="text" placeholder="Kamal" className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Last Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" placeholder="Perera" className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm" required />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Email Address</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="kamal@example.com" className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Phone Number <span className="text-green-500">(Whatsapp) </span></label>
                <div className="relative group">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="tel" placeholder="07X XXX XXXX" className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm" required />
                </div>
              </div>
            </div>

            {/* --- UPDATED: Dynamic Batch Selection --- */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">A/L Batch</label>
              <div className="relative group">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                <select 
                  name="batch" 
                  value={formData.batch} 
                  onChange={handleChange} 
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm appearance-none cursor-pointer" 
                  required
                  disabled={loadingBatches}
                >
                  <option value="" disabled>
                    {loadingBatches ? "Loading batches..." : "Select your Batch"}
                  </option>
                  
                  {/* Map batches dynamically */}
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {loadingBatches ? (
                    <div className="w-4 h-4 border-2 border-[#05668A] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 text-[#05668A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  )}
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input name="password" value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} placeholder="Min 6 chars" className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-8 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#053A4E]">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Confirm</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter" className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-8 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#053A4E]">
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-[#05668A] font-bold hover:underline">Login here</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}