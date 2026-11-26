import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  Camera,
  Lock,
  ShieldCheck,
  GraduationCap,
  Loader2,
  ChevronRight,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

// Services & Context
import { useAuth } from "../../../contexts/AuthContext";
import UserService from "../../../services/UserService";

// Tabs
import PersonalTab from "./tabs/PersonalTab";
import AcademicTab from "./tabs/AcademicTab";
import SecurityTab from "./tabs/SecurityTab";

// Helper for image URL
const getServerUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${import.meta.env.VITE_API_BASE_URL}/${cleanPath}`;
};

type ProfileTab = "personal" | "academic" | "security";

const PROFILE_TABS: {
  id: ProfileTab;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
    {
      id: "personal",
      label: "Personal Info",
      desc: "Name, contact & address",
      icon: UserIcon,
    },
    {
      id: "academic",
      label: "Academic Details",
      desc: "Batch, school & stream",
      icon: GraduationCap,
    },
    {
      id: "security",
      label: "Security & Password",
      desc: "Password & account safety",
      icon: Lock,
    },
  ];

export default function StudentProfile() {
  const { user, fetchMe } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingImage(true);
      setUploadError(null);
      try {
        await UserService.updateUserProfile({
          firstName: user?.firstName || "",
          profileImage: file,
        });
        await fetchMe();
      } catch (error) {
        console.error(error);
        setUploadError("Failed to upload profile picture. Please try again.");
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  // --- LOADING SKELETON ---
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-pulse">
        <div className="h-44 rounded-[2rem] bg-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 rounded-3xl bg-white border border-gray-100" />
          <div className="lg:col-span-2 h-96 rounded-3xl bg-white border border-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 sm:pb-10">
      {/* --- HERO PROFILE BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white/25 shadow-xl overflow-hidden bg-white/10 backdrop-blur-md">
              {user.profileImage ? (
                <img
                  src={getServerUrl(user.profileImage)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className={`w-full h-full object-cover transition-opacity ${uploadingImage ? "opacity-50" : "opacity-100"
                    }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-jasmine to-brand-coral text-brand-prussian text-3xl sm:text-4xl font-black">
                  {user.firstName?.charAt(0).toUpperCase() || "S"}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-jasmine hover:bg-white text-brand-prussian rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-70 border-2 border-brand-prussian"
              title="Change Profile Picture"
              aria-label="Change Profile Picture"
            >
              {uploadingImage ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Camera size={17} />
              )}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Student Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-brand-jasmine mb-2.5">
              <Sparkles size={11} />
              <span>{user.role || "Student"} Account</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
              {user.firstName} {user.lastName}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} className="text-brand-jasmine" />
                <span className="truncate">{user.email}</span>
              </span>

              {(user as any).isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-200 bg-emerald-400/20 border border-emerald-300/25 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={13} />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- UPLOAD ERROR BANNER --- */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="p-1 rounded-lg hover:bg-red-100 text-red-500"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE HORIZONTAL TABS --- */}
      <div className="lg:hidden bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {PROFILE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isActive
                    ? "bg-brand-prussian text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-brand-prussian"
                  }`}
              >
                <Icon
                  size={15}
                  className={isActive ? "text-brand-jasmine" : "text-gray-400"}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MAIN SETTINGS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR NAVIGATION (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-3 space-y-1.5">
            <div className="px-3 pt-2 pb-3 border-b border-gray-100 mb-2">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
                Profile Settings
              </h2>
            </div>

            {PROFILE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-colors group ${isActive
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-brand-prussian"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="profile-active-tab"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-2xl bg-brand-prussian shadow-md shadow-brand-prussian/15"
                    />
                  )}

                  <div
                    className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? "bg-white/15 text-brand-jasmine"
                        : "bg-brand-aliceBlue/60 text-brand-cerulean group-hover:bg-brand-aliceBlue"
                      }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="relative z-10 flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold leading-tight truncate ${isActive ? "text-white" : "text-brand-prussian"
                        }`}
                    >
                      {tab.label}
                    </p>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${isActive ? "text-white/70" : "text-gray-400"
                        }`}
                    >
                      {tab.desc}
                    </p>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`relative z-10 shrink-0 transition-transform ${isActive
                        ? "text-brand-jasmine translate-x-0.5"
                        : "text-gray-300 group-hover:text-brand-cerulean"
                      }`}
                  />
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <main className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === "personal" && <PersonalTab />}
              {activeTab === "academic" && <AcademicTab />}
              {activeTab === "security" && <SecurityTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}