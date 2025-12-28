import React, { useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, Mail, Camera, Lock, Shield, GraduationCap
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
  return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
};

export default function StudentProfile() {
  const { user, fetchMe } = useAuth(); 
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "security">("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await UserService.updateUserProfile({ 
            firstName: user?.firstName || "", 
            profileImage: file 
        });
        await fetchMe(); 
      } catch (error) {
        console.error(error);
        alert("Failed to upload image.");
      }
    }
  };

  if (!user) return <div className="p-10 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-brand-aliceBlue/30 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- Header Card --- */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-prussian to-brand-cerulean opacity-10"></div>
          
          {/* Avatar */}
          <div className="relative group shrink-0 z-10">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              {user.profileImage ? (
                <img 
                  src={getServerUrl(user.profileImage)} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-prussian text-white text-3xl font-bold">
                  {user.firstName.charAt(0)}
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2 bg-brand-cerulean text-white rounded-full shadow-md hover:bg-brand-coral transition-colors"
              title="Change Profile Picture"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Info */}
          <div className="text-center md:text-left z-10 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
            <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
              <Mail size={14} /> {user.email}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
              <span className="px-3 py-1 bg-brand-aliceBlue text-brand-cerulean text-xs font-bold rounded-full uppercase tracking-wider">
                {user.role}
              </span>
              {(user as any).isVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <Shield size={12} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- Left Column: Navigation --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-800">Profile Settings</h3>
              </div>
              <div className="flex flex-col">
                <button 
                  onClick={() => setActiveTab("personal")}
                  className={`flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors text-left border-l-4 ${activeTab === 'personal' ? 'border-brand-cerulean bg-brand-aliceBlue/20 text-brand-prussian' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  <UserIcon size={18} /> Personal Information
                </button>
                <button 
                  onClick={() => setActiveTab("academic")}
                  className={`flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors text-left border-l-4 ${activeTab === 'academic' ? 'border-brand-cerulean bg-brand-aliceBlue/20 text-brand-prussian' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  <GraduationCap size={18} /> Academic Details
                </button>
                <button 
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors text-left border-l-4 ${activeTab === 'security' ? 'border-brand-cerulean bg-brand-aliceBlue/20 text-brand-prussian' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  <Lock size={18} /> Security & Password
                </button>
              </div>
            </div>
          </div>

          {/* --- Right Column: Content --- */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === "personal" && <PersonalTab key="personal" />}
              {activeTab === "academic" && <AcademicTab key="academic" />}
              {activeTab === "security" && <SecurityTab key="security" />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}