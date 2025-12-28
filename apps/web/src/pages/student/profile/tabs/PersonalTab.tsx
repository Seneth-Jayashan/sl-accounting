import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Loader2, Save, X } from "lucide-react";
import UserService from "../../../../services/UserService";
import { useAuth } from "../../../../contexts/AuthContext";

// Interface for local form state
interface AddressType {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PersonalForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: AddressType;
}

export default function PersonalTab() {
  const { user, fetchMe } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form state
  const [formData, setFormData] = useState<PersonalForm>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: { street: "", city: "", state: "", zipCode: "" } as AddressType
  });

  // Load data from User context
  useEffect(() => {
    if (user) {
      // Check if address is stored as object or string in DB
      let parsedAddress: AddressType = { street: "", city: "", state: "", zipCode: "" };
      
      const rawAddr = (user as any).address;
      if (rawAddr && typeof rawAddr === 'object') {
        parsedAddress = rawAddr;
      }

      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        address: parsedAddress
      });
    }
  }, [user]);

  // Handle generic input change
  const handleChange = (field: keyof PersonalForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle address specific change
  const handleAddressChange = (field: keyof AddressType, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pass the form data (UserService will JSON.stringify the address object)
      await UserService.updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address // Passing the object here
      });
      
      await fetchMe();
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-brand-cerulean hover:text-brand-prussian transition-colors">
            Edit Details
          </button>
        ) : (
          <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- Basic Info --- */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">First Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              disabled={!isEditing}
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Last Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              disabled={!isEditing}
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="email" 
              disabled 
              value={user?.email || ""}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="tel" 
              disabled={!isEditing}
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        {/* --- Address Section (4 Inputs) --- */}
        <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-brand-cerulean"/> Address Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Street */}
                <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Street Address</label>
                    <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.address.street}
                        onChange={(e) => handleAddressChange("street", e.target.value)}
                        placeholder="123 Main St"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                {/* City */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">City</label>
                    <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                        placeholder="Colombo"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                {/* State / Province */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">State / Province</label>
                    <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.address.state}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                        placeholder="Western Province"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                 {/* Zip Code */}
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Zip / Postal Code</label>
                    <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.address.zipCode}
                        onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                        placeholder="10000"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="md:col-span-2 flex justify-end mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-prussian text-white font-bold rounded-xl hover:bg-brand-cerulean transition-colors disabled:opacity-50 shadow-lg shadow-brand-prussian/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        )}
      </form>
    </motion.div>
  );
}