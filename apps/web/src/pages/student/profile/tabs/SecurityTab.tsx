import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import UserService from "../../../../services/UserService";

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", barColor: "bg-gray-200", textColor: "text-gray-400" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: "Weak", barColor: "bg-red-500", textColor: "text-red-500" };
  }
  if (score === 2) {
    return { score: 2, label: "Fair", barColor: "bg-amber-400", textColor: "text-amber-600" };
  }
  if (score === 3) {
    return { score: 3, label: "Good", barColor: "bg-sky-500", textColor: "text-sky-600" };
  }
  return { score: 4, label: "Strong", barColor: "bg-emerald-500", textColor: "text-emerald-600" };
}

export default function SecurityTab() {
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const strength = useMemo(
    () => getPasswordStrength(passForm.newPassword),
    [passForm.newPassword]
  );

  const passwordsMatch =
    passForm.confirmPassword.length > 0 &&
    passForm.newPassword === passForm.confirmPassword;
  const passwordsMismatch =
    passForm.confirmPassword.length > 0 &&
    passForm.newPassword !== passForm.confirmPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (passForm.newPassword !== passForm.confirmPassword) {
      setFeedback({
        type: "error",
        message: "New passwords do not match. Please double-check.",
      });
      return;
    }

    if (passForm.newPassword.length < 6) {
      setFeedback({
        type: "error",
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);
    try {
      await UserService.updateUserPassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFeedback({
        type: "success",
        message: "Your password has been updated successfully.",
      });
    } catch (error: any) {
      setFeedback({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Failed to change password. Please check your current password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-7 space-y-6"
    >
      {/* --- HEADER --- */}
      <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100">
        <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
          <Lock size={20} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-brand-prussian tracking-tight leading-tight">
            Security & Password
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Update your password to keep your student account protected
          </p>
        </div>
      </div>

      {/* --- INLINE FEEDBACK BANNER --- */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200/80 text-emerald-700"
                : "bg-red-50 border-red-200/80 text-red-700"
              }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-500 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM --- */}
      <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <KeyRound
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type={showPass.current ? "text" : "password"}
              required
              value={passForm.currentPassword}
              onChange={(e) =>
                setPassForm({ ...passForm, currentPassword: e.target.value })
              }
              className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200/90 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none transition-all"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() =>
                setShowPass((prev) => ({ ...prev, current: !prev.current }))
              }
              aria-label={
                showPass.current ? "Hide current password" : "Show current password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-prussian transition-colors"
            >
              {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type={showPass.new ? "text" : "password"}
              required
              value={passForm.newPassword}
              onChange={(e) =>
                setPassForm({ ...passForm, newPassword: e.target.value })
              }
              className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200/90 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none transition-all"
              placeholder="Create a strong new password"
            />
            <button
              type="button"
              onClick={() =>
                setShowPass((prev) => ({ ...prev, new: !prev.new }))
              }
              aria-label={showPass.new ? "Hide new password" : "Show new password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-prussian transition-colors"
            >
              {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength Meter */}
          {passForm.newPassword && (
            <div className="pt-1.5 space-y-1.5">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 rounded-full transition-colors duration-300 ${strength.score >= level ? strength.barColor : "bg-gray-100"
                      }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-gray-400">Password strength</span>
                <span className={strength.textColor}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type={showPass.confirm ? "text" : "password"}
              required
              value={passForm.confirmPassword}
              onChange={(e) =>
                setPassForm({ ...passForm, confirmPassword: e.target.value })
              }
              className={`w-full pl-10 pr-11 py-3 bg-gray-50 border rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 outline-none transition-all ${passwordsMismatch
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : passwordsMatch
                    ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                    : "border-gray-200/90 focus:border-brand-cerulean focus:ring-brand-cerulean/15"
                }`}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() =>
                setShowPass((prev) => ({ ...prev, confirm: !prev.confirm }))
              }
              aria-label={
                showPass.confirm
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-prussian transition-colors"
            >
              {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {passwordsMatch && (
            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-0.5">
              <Check size={12} strokeWidth={3} />
              Passwords match
            </p>
          )}
          {passwordsMismatch && (
            <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 pt-0.5">
              <AlertCircle size={12} />
              Passwords do not match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || passwordsMismatch}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-prussian hover:bg-brand-cerulean text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-brand-prussian/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={17} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* --- SECURITY TIPS FOOTER --- */}
      <div className="rounded-2xl bg-brand-aliceBlue/40 border border-brand-cerulean/15 p-4 flex items-start gap-3">
        <ShieldCheck
          size={18}
          className="text-brand-cerulean shrink-0 mt-0.5"
        />
        <div className="text-xs text-gray-600 leading-relaxed">
          <span className="font-extrabold text-brand-prussian block mb-0.5">
            Account Security Tip
          </span>
          Use at least 8 characters with a mix of uppercase letters, numbers, and
          symbols. Never share your login credentials with anyone.
        </div>
      </div>
    </motion.div>
  );
}