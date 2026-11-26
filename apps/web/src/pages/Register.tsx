import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  AlertCircle,
  UploadCloud,
  Sparkles,
  PlayCircle,
  BookOpen,
  Award,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BatchService, { type BatchData } from "../services/BatchService";
import { z } from "zod";

// --- VALIDATION SCHEMA ---
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .trim(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .trim(),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    phoneNumber: z
      .string()
      .regex(
        /^(\+94|0)?7[0-9]{8}$/,
        "Enter a valid SL mobile number (e.g., 0771234567)"
      ),
    batch: z.string().min(1, "Please select your A/L batch"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character (@$!%*?&)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- OPTIMIZED AMBIENT BACKGROUND (Memoized) ---
const BackgroundGradient = memo(() => (
  <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#FAFCFF] pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(#053A4E_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035]" />
    <motion.div
      animate={{ scale: [1, 1.08, 1], x: [0, 25, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-24 -right-20 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-brand-cerulean/15 rounded-full blur-[90px] sm:blur-[120px] will-change-transform"
    />
    <motion.div
      animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
      transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -bottom-28 -left-20 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-brand-coral/12 rounded-full blur-[90px] sm:blur-[120px] will-change-transform"
    />
  </div>
));

// --- LIVE PASSWORD STRENGTH & REQUIREMENTS ---
const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;

  const rules = [
    { label: "8+ chars", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = rules.filter((r) => r.met).length;
  const barColors = [
    "bg-rose-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-emerald-500",
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1">
        {rules.map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${i < metCount ? barColors[metCount - 1] : "bg-slate-200"
              }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {rules.map((r) => (
          <span
            key={r.label}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${r.met
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-400"
              }`}
          >
            {r.met && <Check size={10} strokeWidth={3} />}
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- REUSABLE INPUT FIELD ---
interface InputFieldProps {
  id: string;
  label: string;
  name: string;
  type?: string;
  icon: React.ComponentType<{ size?: number }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  name,
  type = "text",
  icon: Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  error,
  rightElement,
}) => (
  <div className="space-y-1.5 w-full">
    <label
      htmlFor={id}
      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider"
    >
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative group">
      <div
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error
            ? "text-rose-500"
            : "text-slate-400 group-focus-within:text-brand-cerulean"
          }`}
      >
        <Icon size={16} />
      </div>
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full bg-slate-50 border ${error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15"
            : "border-slate-200/80 focus:border-brand-cerulean focus:ring-brand-cerulean/20"
          } focus:bg-white focus:ring-2 text-brand-prussian placeholder:text-slate-400 pl-10 ${rightElement ? "pr-10" : "pr-3.5"
          } py-2.5 rounded-xl outline-none transition-all text-sm font-medium`}
      />
      {rightElement && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {error && (
      <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 pt-0.5">
        <AlertCircle size={12} className="shrink-0" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

// --- REGISTER COMPONENT ---
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
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(
    null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    let isMounted = true;
    const fetchBatches = async () => {
      try {
        const data = await BatchService.getAllPublicBatches();
        if (isMounted) {
          const batchList = Array.isArray(data.batches)
            ? data.batches
            : (data as any).data || [];
          setBatches(batchList);
        }
      } catch (err) {
        console.error("Failed to fetch batches", err);
      } finally {
        if (isMounted) setLoadingBatches(false);
      }
    };
    fetchBatches();
    return () => {
      isMounted = false;
    };
  }, []);

  // Create & revoke avatar preview URL cleanly
  useEffect(() => {
    if (!profileFile) {
      setProfilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profileFile);
    setProfilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (generalError) setGeneralError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "File size too large (Max 5MB)",
      }));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Only JPG, PNG, or WebP images are allowed",
      }));
      return;
    }

    setProfileFile(file);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.profileImage;
      return newErrors;
    });
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
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
        password: result.data.password,
        phoneNumber: result.data.phoneNumber,
        batch: result.data.batch,
        profileImageFile: profileFile,
      });

      setSuccessMsg("Account created! Redirecting to email verification...");
      setTimeout(() => {
        navigate("/verification", {
          state: {
            email: result.data.email,
            ...(returnTo ? { from: returnTo } : {}),
          },
        });
      }, 1200);
    } catch (err: any) {
      setGeneralError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const studentBenefits = [
    {
      icon: PlayCircle,
      title: "Instant Class & Replay Access",
      desc: "Watch live Zoom classes and stream HD recordings anytime.",
    },
    {
      icon: BookOpen,
      title: "Tutes & Printed Study Packs",
      desc: "Download PDFs or get printed packs delivered to your door.",
    },
    {
      icon: Award,
      title: "Live Quizzes & Exam Tracking",
      desc: "Benchmark your progress across all 16 A/L Accounting units.",
    },
  ];

  return (
    <div className="w-full min-h-screen relative overflow-x-hidden flex items-center justify-center pt-28 pb-14 px-4 sm:px-6 font-sans text-brand-prussian selection:bg-brand-cerulean selection:text-white">
      {/* Ambient Background */}
      <BackgroundGradient />

      {/* Unified Split Registration Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-brand-prussian/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* LEFT COLUMN: BRAND & STUDENT ONBOARDING PANEL (5 cols on lg) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-cerulean rounded-full blur-3xl opacity-35 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-coral rounded-full blur-3xl opacity-25 pointer-events-none" />

          {/* Top Headline */}
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-brand-jasmine text-[11px] font-bold uppercase tracking-widest">
              <Sparkles size={14} />
              <span>Join 1,000+ A/L Students</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-black leading-[1.15] font-sinhala">
              අනාගතය දිනන <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">
                පවුලට එක්වන්න
              </span>
            </h2>

            <p className="text-white/75 text-sm leading-relaxed font-sans">
              Create your free SL Accounting LMS account in under a minute and start building toward your A/L Accounting distinction.
            </p>
          </div>

          {/* Benefit Cards */}
          <div className="relative z-10 space-y-3 my-8">
            {studentBenefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-brand-jasmine flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-white/65 leading-relaxed mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Attribution */}
          <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-brand-jasmine">
                KW
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kalum Waduge</p>
                <p className="text-[11px] text-white/60">
                  BSc. Accounting (Sp) USJP
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-brand-jasmine">
              SL LMS
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: REGISTRATION FORM (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-11 flex flex-col justify-between">
          <div>
            {/* Back Link */}
            <div className="mb-5">
              <Link
                to="/"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-prussian transition-colors"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
                <span>Back to Home</span>
              </Link>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">
                Create Student Account
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Enter your details below to register for your A/L batch on SL Accounting.
              </p>
            </div>

            {/* Status Banners */}
            <AnimatePresence>
              {generalError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-medium flex items-center gap-2.5"
                >
                  <AlertCircle size={17} className="text-rose-500 shrink-0" />
                  <span>{generalError}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs sm:text-sm font-medium flex items-center gap-2.5"
                >
                  <CheckCircle2
                    size={17}
                    className="text-emerald-600 shrink-0"
                  />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="reg-first-name"
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  icon={User}
                  placeholder="Kamal"
                  autoComplete="given-name"
                  required
                  error={errors.firstName}
                />
                <InputField
                  id="reg-last-name"
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  icon={User}
                  placeholder="Perera"
                  autoComplete="family-name"
                  required
                  error={errors.lastName}
                />
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="reg-email"
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  icon={Mail}
                  placeholder="kamal@example.com"
                  autoComplete="email"
                  required
                  error={errors.email}
                />
                <InputField
                  id="reg-phone"
                  label="WhatsApp Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  icon={Phone}
                  placeholder="0771234567"
                  autoComplete="tel"
                  required
                  error={errors.phoneNumber}
                />
              </div>

              {/* Batch & Profile Photo Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Batch Selection */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-batch"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    A/L Batch <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar
                      size={16}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${errors.batch
                          ? "text-rose-500"
                          : "text-slate-400 group-focus-within:text-brand-cerulean"
                        }`}
                    />
                    <select
                      id="reg-batch"
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      disabled={loadingBatches}
                      className={`w-full appearance-none bg-slate-50 border ${errors.batch
                          ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15"
                          : "border-slate-200/80 focus:border-brand-cerulean focus:ring-brand-cerulean/20"
                        } focus:bg-white focus:ring-2 text-brand-prussian pl-10 pr-9 py-2.5 rounded-xl outline-none transition-all text-sm font-medium cursor-pointer disabled:opacity-60`}
                    >
                      <option value="" disabled>
                        {loadingBatches
                          ? "Loading batches..."
                          : "Select your batch"}
                      </option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.batch && (
                    <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 pt-0.5">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.batch}</span>
                    </p>
                  )}
                </div>

                {/* Profile Picture Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Profile Photo{" "}
                    <span className="text-slate-400 font-normal normal-case">
                      (Optional)
                    </span>
                  </label>

                  {!profileFile ? (
                    <label
                      className={`relative flex items-center justify-center gap-2 border border-dashed rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-all ${errors.profileImage
                          ? "border-rose-300 bg-rose-50 text-rose-600"
                          : "border-slate-300 bg-slate-50 hover:bg-brand-aliceBlue/40 hover:border-brand-cerulean text-slate-600"
                        }`}
                    >
                      <UploadCloud
                        size={16}
                        className="text-brand-cerulean shrink-0"
                      />
                      <span className="truncate">Upload JPG / PNG</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-2 bg-brand-aliceBlue/50 border border-brand-cerulean/25 rounded-xl px-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {profilePreviewUrl && (
                          <img
                            src={profilePreviewUrl}
                            alt="Avatar preview"
                            className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white"
                          />
                        )}
                        <span className="text-xs font-semibold text-brand-prussian truncate">
                          {profileFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => setProfileFile(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {errors.profileImage && (
                    <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1 pt-0.5">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.profileImage}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Passwords Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <InputField
                    id="reg-password"
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    icon={Lock}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    error={errors.password}
                    rightElement={
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="p-1 rounded-lg text-slate-400 hover:text-brand-prussian"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    }
                  />
                  <PasswordStrength password={formData.password} />
                </div>

                <InputField
                  id="reg-confirm-password"
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={Lock}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  error={errors.confirmPassword}
                  rightElement={
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-prussian"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-brand-prussian/15 hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Student Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Login Footer */}
          <div className="mt-7 pt-5 border-t border-slate-100 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-slate-500">
            <span>Already have an account?</span>
            <Link
              to="/login"
              state={returnTo ? { from: returnTo } : undefined}
              className="font-bold text-brand-cerulean hover:text-brand-prussian transition-colors inline-flex items-center gap-1"
            >
              <span>Login to LMS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}