import React, { useState, useEffect } from "react";
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
  Calendar,
  AlertCircle,
  UploadCloud
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BatchService, { type BatchData } from "../services/BatchService";
import { z } from "zod";

// --- VALIDATION SCHEMA ---
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").trim(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").trim(),
  email: z.string()
    .email("Invalid email address")
    .trim()
    .toLowerCase()
    .refine((val) => val.endsWith("@gmail.com"), {
      message: "Only Gmail addresses are allowed",
    }),
  phoneNumber: z
    .string()
    .regex(/^(\+94|0)?7[0-9]{8}$/, "Enter a valid SL phone number (e.g., 0771234567)"),
  batch: z.string().min(1, "Please select your A/L batch"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character (@$!%*?&)"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

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
  </div>
);

// --- PASSWORD STRENGTH METER ---
const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  
  return (
    <div className="flex gap-1 mt-1 h-1">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className={`h-full flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : "bg-gray-200"}`} 
        />
      ))}
    </div>
  );
};

// --- REUSABLE INPUT COMPONENT (MOVED OUTSIDE) ---
// Now accepts 'onChange' as a prop instead of using the parent's handleChange directly
const InputField = ({ 
    label, name, type = "text", icon: Icon, value, onChange, placeholder, error, rightElement 
  }: any) => (
    <div className="space-y-1 w-full">
      <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">
        {label}
      </label>
      <div className="relative group">
        <Icon size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? "text-red-500" : "text-[#05668A]"}`} />
        <input
          name={name}
          value={value}
          onChange={onChange} // Use the prop here
          type={type}
          placeholder={placeholder}
          className={`w-full bg-white/50 border ${error ? "border-red-400 focus:border-red-500" : "border-white/50 focus:border-[#05668A]"} focus:bg-white text-[#053A4E] pl-9 pr-${rightElement ? "8" : "3"} py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm`}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs ml-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
    </div>
);

// --- REGISTER FORM COMPONENT ---
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await BatchService.getAllPublicBatches();
        const batchList = Array.isArray(data.batches) ? data.batches : (data as any).data || [];
        setBatches(batchList);
      } catch (err) {
        console.error("Failed to fetch batches", err);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { 
            setErrors(prev => ({...prev, profileImage: "File size too large (Max 5MB)"}));
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setErrors(prev => ({...prev, profileImage: "Only JPG, PNG or WebP allowed"}));
            return;
        }
        setProfileFile(file);
        setErrors(prev => {
            const newErrors = {...prev}; 
            delete newErrors.profileImage; 
            return newErrors;
        });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMsg(null);
    setErrors({});

    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        batch: formData.batch,
        profileImageFile: profileFile,
      });

      setSuccessMsg("Registration successful! Redirecting...");
      setTimeout(() => {
        navigate("/verification", { state: { email: formData.email } });
      }, 1500);

    } catch (err: any) {
      setGeneralError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-y-auto overflow-x-hidden flex items-center justify-center md:justify-end pt-24 pb-12">
      <BackgroundGradient />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start md:items-center">
        {/* Left Side */}
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
            Create your student account today to access exclusive A/L Accounting tutorials.
          </p>
        </motion.div>

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full max-w-xl mx-auto md:mx-0 mt-4 md:mt-12"
        >
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#053A4E]">Register</h2>
            <p className="text-gray-500 text-sm mt-1">Create your secure student account</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            {generalError && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">{generalError}</div>}
            {successMsg && <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">{successMsg}</div>}

            {/* Names - PASS handleChange HERE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} icon={User} placeholder="Kamal" error={errors.firstName} />
              <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} icon={User} placeholder="Perera" error={errors.lastName} />
            </div>

            {/* Contact - PASS handleChange HERE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} icon={Mail} placeholder="kamal@example.com" error={errors.email} />
              <InputField label="Whatsapp Number" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} icon={Phone} placeholder="077 123 4567" error={errors.phoneNumber} />
            </div>

            {/* Batch Selection */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">A/L Batch</label>
              <div className="relative group">
                <Calendar size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.batch ? "text-red-500" : "text-[#05668A]"}`} />
                <select 
                  name="batch" 
                  value={formData.batch} 
                  onChange={handleChange} 
                  className={`w-full bg-white/50 border ${errors.batch ? "border-red-400" : "border-white/50 focus:border-[#05668A]"} focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm appearance-none cursor-pointer`}
                  disabled={loadingBatches}
                >
                  <option value="" disabled>{loadingBatches ? "Loading..." : "Select your Batch"}</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>{batch.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-[#05668A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {errors.batch && <p className="text-red-500 text-xs ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.batch}</p>}
            </div>

             {/* Profile Picture */}
             <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Profile Photo (Optional)</label>
                <div className={`relative border-2 border-dashed ${errors.profileImage ? "border-red-300 bg-red-50" : "border-[#05668A]/30 hover:border-[#05668A] bg-white/30 hover:bg-white/50"} rounded-xl p-2 transition-all cursor-pointer`}>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 text-[#053A4E] text-sm">
                        <UploadCloud size={18} />
                        <span className="truncate max-w-[200px]">
                            {profileFile ? profileFile.name : "Click to upload image"}
                        </span>
                    </div>
                </div>
                {errors.profileImage && <p className="text-red-500 text-xs ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.profileImage}</p>}
            </div>

            {/* Passwords - PASS handleChange HERE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <InputField 
                    label="Password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={handleChange}
                    icon={Lock} 
                    placeholder="Min 8 chars" 
                    error={errors.password}
                    rightElement={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#053A4E]">
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    }
                />
                <PasswordStrength password={formData.password} />
              </div>
              
              <InputField 
                  label="Confirm" 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  icon={Lock} 
                  placeholder="Re-enter" 
                  error={errors.confirmPassword}
                  rightElement={
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-[#053A4E]">
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
              />
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