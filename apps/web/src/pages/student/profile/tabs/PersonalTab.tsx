import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Save,
  X,
  Pencil,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import UserService from "../../../../services/UserService";
import { useAuth } from "../../../../contexts/AuthContext";

interface AddressType {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  nearestPostOffice: string;
}

interface PersonalForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: AddressType;
}

const EMPTY_ADDRESS: AddressType = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
  nearestPostOffice: "",
};

export default function PersonalTab() {
  const { user, fetchMe } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<PersonalForm>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: { ...EMPTY_ADDRESS },
  });

  const syncFromUser = useCallback(() => {
    if (!user) return;
    const rawAddr = (user as any).address;
    const parsedAddress: AddressType =
      rawAddr && typeof rawAddr === "object"
        ? {
          street: rawAddr.street || "",
          city: rawAddr.city || "",
          state: rawAddr.state || "",
          zipCode: rawAddr.zipCode || "",
          nearestPostOffice: rawAddr.nearestPostOffice || "",
        }
        : { ...EMPTY_ADDRESS };

    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      address: parsedAddress,
    });
  }, [user]);

  useEffect(() => {
    syncFromUser();
  }, [syncFromUser]);

  const handleChange = (field: keyof PersonalForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: keyof AddressType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleCancel = () => {
    syncFromUser();
    setIsEditing(false);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await UserService.updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address,
      });

      await fetchMe();
      setIsEditing(false);
      setFeedback({
        type: "success",
        message: "Your personal details have been updated.",
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass = isEditing
    ? "bg-white border-gray-200 text-gray-900 focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15"
    : "bg-gray-50/70 border-gray-100 text-gray-700 cursor-default";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-7 space-y-6"
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-prussian tracking-tight leading-tight">
              Personal Details
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your contact information and delivery address
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setIsEditing(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-aliceBlue/80 hover:bg-brand-prussian text-brand-prussian hover:text-white text-xs sm:text-sm font-bold transition-all active:scale-95 self-start sm:self-auto"
          >
            <Pencil size={14} />
            <span>Edit Details</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-bold transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <X size={15} />
            <span>Cancel</span>
          </button>
        )}
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
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* First Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              First Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="text"
                disabled={!isEditing}
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Last Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="text"
                disabled={!isEditing}
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Lock size={10} />
                Read-only
              </span>
            </div>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full pl-10 pr-4 py-3 bg-gray-100/80 border border-gray-200/70 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="tel"
                disabled={!isEditing}
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="07X XXX XXXX"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>
          </div>
        </div>

        {/* --- ADDRESS SECTION --- */}
        <div className="rounded-2xl bg-gray-50/70 border border-gray-100 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-sm font-extrabold text-brand-prussian flex items-center gap-2">
              <MapPin size={16} className="text-brand-cerulean" />
              <span>Address & Tute Delivery Details</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">
              Used for shipping printed study packs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Street */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="123 Main Street"
                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                City
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="Galle"
                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>

            {/* State / Province */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Province
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.address.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                placeholder="Southern Province"
                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>

            {/* Zip Code */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Postal Code
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.address.zipCode}
                onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                placeholder="80000"
                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
              />
            </div>

            {/* Nearest Post Office */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Nearest Post Office
              </label>
              <div className="relative">
                <Building
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={15}
                />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address.nearestPostOffice}
                  onChange={(e) =>
                    handleAddressChange("nearestPostOffice", e.target.value)
                  }
                  placeholder="e.g. Galle 05 Post Office"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all ${inputBaseClass}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- SAVE ACTION BAR --- */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100"
            >
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-prussian hover:bg-brand-cerulean text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-brand-prussian/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}