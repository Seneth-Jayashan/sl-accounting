import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import UserService from "../../../../services/UserService";

export default function SecurityTab() {
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await UserService.updateUserPassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed successfully.");
    } catch (error) {
      alert("Failed to change password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6">Change Password</h2>
      <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
          <input 
            type="password"
            required 
            value={passForm.currentPassword}
            onChange={(e) => setPassForm({...passForm, currentPassword: e.target.value})}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
          <input 
            type="password" 
            required
            value={passForm.newPassword}
            onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
          <input 
            type="password" 
            required
            value={passForm.confirmPassword}
            onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-brand-cerulean text-white font-bold rounded-xl hover:bg-brand-prussian transition-colors disabled:opacity-50 shadow-md w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? "Updating..." : "Update Password"}
            </button>
        </div>

      </form>
    </motion.div>
  );
}