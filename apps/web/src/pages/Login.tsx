import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Award,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { z } from "zod";
import ResendVerificationModal from "../components/modals/ResendVerification";

// --- 1. SECURITY SCHEMA ---
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const REMEMBER_EMAIL_KEY = "sl_accounting_remembered_email";

// --- 2. OPTIMIZED AMBIENT BACKGROUND (Memoized) ---
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

// --- 3. REUSABLE INPUT FIELD ---
interface InputFieldProps {
  id: string;
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ComponentType<{ size?: number }>;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  rightElement?: React.ReactNode;
  labelRight?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  name,
  type = "text",
  value,
  onChange,
  icon: Icon,
  placeholder,
  autoComplete,
  error,
  rightElement,
  labelRight,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      {labelRight}
    </div>

    <div className="relative group">
      <div
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error
            ? "text-rose-500"
            : "text-slate-400 group-focus-within:text-brand-cerulean"
          }`}
      >
        <Icon size={18} />
      </div>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full bg-slate-50 border ${error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15"
            : "border-slate-200/80 focus:border-brand-cerulean focus:ring-brand-cerulean/20"
          } focus:bg-white focus:ring-2 text-brand-prussian placeholder:text-slate-400 pl-10 ${rightElement ? "pr-11" : "pr-4"
          } py-3 rounded-xl text-sm font-medium outline-none transition-all`}
      />

      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>

    {error && (
      <p className="text-rose-600 text-xs font-medium flex items-center gap-1 pt-0.5">
        <AlertCircle size={13} className="shrink-0" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

// --- MAIN LOGIN COMPONENT ---
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [isUnverifiedError, setIsUnverifiedError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Prefill remembered email if saved previously
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) {
      setGeneralError("");
      setIsUnverifiedError(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setIsUnverifiedError(false);
    setFieldErrors({});

    const validationResult = loginSchema.safeParse(formData);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    const { email, password } = validationResult.data;
    setIsSubmitting(true);

    try {
      await login({ email, password });

      // Persist or clear remembered email
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignore storage errors
      }

      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }

      // Fetch role for dashboard redirect
      try {
        const res = await api.get("/auth/me");
        const role = res.data?.user?.role;
        navigate(role === "admin" ? "/admin/dashboard" : "/student/dashboard");
      } catch {
        navigate("/student/dashboard");
      }
    } catch (err: any) {
      console.error("Login Error:", err);

      const status = err.response?.status;
      const responseMsg = (err.response?.data?.message || "").toLowerCase();
      const msg = err.message || "Failed to login. Please try again.";

      if (
        status === 403 &&
        (responseMsg.includes("verify") ||
          responseMsg.includes("active") ||
          responseMsg.includes("verified"))
      ) {
        setIsVerifyModalOpen(true);
        setIsUnverifiedError(true);
        setGeneralError(
          "Your account is not verified yet. Please verify your email to continue."
        );
      } else if (status === 401) {
        setGeneralError("Invalid email address or password.");
      } else {
        setGeneralError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const lmsHighlights = [
    {
      icon: PlayCircle,
      title: "HD Live & Recorded Classes",
      desc: "Stream Zoom sessions live or rewatch every unit replay 24/7.",
    },
    {
      icon: BookOpen,
      title: "Structured Tutes & Past Papers",
      desc: "Downloadable PDF study packs and couriered printed materials.",
    },
    {
      icon: Award,
      title: "Timed Quizzes & Live Analytics",
      desc: "Track your syllabus mastery and batch rank in real time.",
    },
  ];

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex items-center justify-center pt-28 pb-14 px-4 sm:px-6 font-sans text-brand-prussian selection:bg-brand-cerulean selection:text-white">
      {/* Ambient Background */}
      <BackgroundGradient />

      {/* Verification Modal */}
      <ResendVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        emailHint={formData.email}
      />

      {/* Unified Split Authentication Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-brand-prussian/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* LEFT COLUMN: LOGIN FORM (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
          <div>
            {/* Top Back Navigation */}
            <div className="mb-6">
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

            {/* Greeting Header */}
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-aliceBlue text-brand-cerulean text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck size={13} />
                <span>SL Accounting LMS</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian font-sinhala tracking-tight">
                ආයුබෝවන්! Welcome Back
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                Sign in to access your classes, recordings, and exam dashboard.
              </p>
            </div>

            {/* Redirect Context Notice */}
            {returnTo && !generalError && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-brand-aliceBlue/60 border border-brand-cerulean/20 text-xs font-medium text-brand-prussian flex items-center gap-2.5">
                <CheckCircle2
                  size={16}
                  className="text-brand-cerulean shrink-0"
                />
                <span>Sign in to continue to your selected class enrollment.</span>
              </div>
            )}

            {/* Error Alert Banner */}
            <AnimatePresence>
              {generalError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3"
                >
                  <AlertCircle
                    className="text-rose-500 shrink-0 mt-0.5"
                    size={18}
                  />
                  <div className="flex-1 text-xs sm:text-sm text-rose-700 font-medium space-y-1.5">
                    <p>{generalError}</p>
                    {isUnverifiedError && (
                      <button
                        type="button"
                        onClick={() => setIsVerifyModalOpen(true)}
                        className="text-xs font-bold text-brand-cerulean hover:text-brand-prussian underline"
                      >
                        Resend verification email →
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-5">
              <InputField
                id="login-email"
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                placeholder="student@example.com"
                autoComplete="email"
                error={fieldErrors.email}
              />

              <InputField
                id="login-password"
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                placeholder="••••••••"
                autoComplete="current-password"
                error={fieldErrors.password}
                labelRight={
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors"
                  >
                    Forgot password?
                  </Link>
                }
                rightElement={
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-prussian hover:bg-slate-200/60 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-prussian select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-prussian focus:ring-brand-cerulean cursor-pointer"
                  />
                  <span>Remember my email</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-brand-prussian/15 hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login to LMS</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Register Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-slate-500">
            <span>New to SL Accounting?</span>
            <Link
              to="/register"
              state={returnTo ? { from: returnTo } : undefined}
              className="font-bold text-brand-cerulean hover:text-brand-prussian transition-colors inline-flex items-center gap-1"
            >
              <span>Create Student Account</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: BRAND & LMS SHOWCASE PANEL (5 cols on lg) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white p-10 flex-col justify-between relative overflow-hidden">
          {/* CSS Dot Grid & Ambient Glows */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-cerulean rounded-full blur-3xl opacity-35 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-coral rounded-full blur-3xl opacity-25 pointer-events-none" />

          {/* Top Content */}
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-brand-jasmine text-[11px] font-bold uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Secure Student Portal</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-black leading-[1.15] font-sinhala">
              ඔබේ ජයග්‍රහණයේ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">
                ආරම්භය මෙතැනයි
              </span>
            </h2>

            <p className="text-white/75 text-sm leading-relaxed font-sans">
              Everything you need to master G.C.E. A/L Accounting—organized into one fast, student-friendly learning workspace.
            </p>
          </div>

          {/* Middle Feature Cards */}
          <div className="relative z-10 space-y-3 my-8">
            {lmsHighlights.map((item, idx) => {
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

          {/* Bottom Instructor Attribution */}
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
              2027 · 2028
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}