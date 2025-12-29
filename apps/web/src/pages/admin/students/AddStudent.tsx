import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

// Services
import AdminService from "../../../services/AdminService";
import BatchService, { type BatchData } from "../../../services/BatchService";

// --- Types ---
interface AddressData {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export default function AddStudentPage() {
  const navigate = useNavigate();

  // --- State ---
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchesLoading, setIsBatchesLoading] = useState(true);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    batch: "",
    address: { street: "", city: "", state: "", zipCode: "" } as AddressData
  });

  const [authData, setAuthData] = useState({
    email: "",
    password: ""
  });

  // --- Initial Data Load ---
  useEffect(() => {
    let isMounted = true;
    const loadBatches = async () => {
      try {
        const response = await BatchService.getAllBatches(true);
        if (isMounted && response.batches && response.batches.length > 0) {
          setBatches(response.batches);
          // Auto-select first batch
          setProfileData(prev => ({ ...prev, batch: response.batches![0]._id }));
        }
      } catch (err) {
        console.error("Failed to load batches", err);
        Swal.fire("Warning", "Failed to load active batches.", "warning");
      } finally {
        if (isMounted) setIsBatchesLoading(false);
      }
    };
    loadBatches();
    return () => { isMounted = false; };
  }, []);

  // --- Handlers ---

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
        ...prev,
        address: { ...prev.address, [name]: value }
    }));
  };

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic Validation
      if (authData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      if (!profileData.batch) {
        throw new Error("Please select a valid batch.");
      }

      // Payload Preparation
      const payload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        batch: profileData.batch,
        address: profileData.address,
        email: authData.email,
        password: authData.password,
        role: "student" as const
      };

      await AdminService.createUser(payload);
      
      Swal.fire({
          title: "Student Registered",
          text: "Account created successfully!",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
      });
      
      navigate("/admin/students");
      
    } catch (err: any) {
      console.error(err);
      Swal.fire("Registration Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 font-sans pb-32 md:pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button 
                onClick={() => navigate("/admin/students")} 
                className="group flex items-center text-gray-500 hover:text-brand-prussian transition-colors font-medium text-xs md:text-sm uppercase tracking-widest"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2 stroke-[3px] group-hover:-translate-x-1 transition-transform" /> 
                Back to Directory
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-brand-prussian tracking-tight">Register Student</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            
            {/* 1. PERSONAL DETAILS */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-brand-aliceBlue">
                <div className="flex items-center justify-between mb-6 border-b border-brand-aliceBlue pb-4">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                        <UserCircleIcon className="w-5 h-5 text-brand-cerulean" /> Personal Details
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <InputField label="First Name" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required placeholder="e.g. Sahan" />
                    <InputField label="Last Name" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required placeholder="e.g. Perera" />
                    <InputField label="Phone Number" name="phoneNumber" value={profileData.phoneNumber} onChange={handleProfileChange} icon={<PhoneIcon className="w-4 h-4 text-gray-400"/>} placeholder="077 123 4567" />
                    
                    {/* Batch Selection */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Assigned Batch</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select 
                                name="batch" 
                                value={profileData.batch} 
                                onChange={handleProfileChange} 
                                disabled={isBatchesLoading}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all appearance-none cursor-pointer text-gray-700 font-medium text-sm"
                            >
                                <option value="" disabled>{isBatchesLoading ? "Loading..." : "Select Batch"}</option>
                                {batches.map(b => (<option key={b._id} value={b._id}>{b.name}</option>))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Address Sub-Section */}
                <div className="mt-8 pt-6 border-t border-brand-aliceBlue">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MapPinIcon className="w-4 h-4 text-brand-cerulean" /> Residential Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Street Address" name="street" value={profileData.address.street} onChange={handleAddressChange} placeholder="No. 123, Main Street" className="md:col-span-2" />
                        <InputField label="City" name="city" value={profileData.address.city} onChange={handleAddressChange} placeholder="Colombo" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="State" name="state" value={profileData.address.state} onChange={handleAddressChange} placeholder="Western" />
                            <InputField label="Zip Code" name="zipCode" value={profileData.address.zipCode} onChange={handleAddressChange} placeholder="10200" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ACCOUNT CREDENTIALS */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-brand-aliceBlue">
                <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-brand-aliceBlue pb-4 uppercase tracking-wide">
                    <EnvelopeIcon className="w-5 h-5 text-brand-cerulean" /> Account Credentials
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Email Address" 
                        name="email" 
                        type="email"
                        placeholder="student@example.com"
                        value={authData.email} 
                        onChange={handleAuthChange} 
                        required
                        icon={<EnvelopeIcon className="w-4 h-4 text-gray-400"/>}
                    />
                    
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-brand-cerulean transition-colors">
                                <LockClosedIcon className="w-4 h-4" />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={authData.password}
                                onChange={handleAuthChange}
                                required
                                placeholder="Min 6 characters"
                                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all text-gray-800 placeholder:text-gray-300 text-sm font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-cerulean transition-colors"
                            >
                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions - Sticky on Mobile */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 md:static md:bg-transparent md:border-none md:p-0 flex items-center justify-end gap-3 z-50 md:z-auto">
                <button
                    type="button"
                    onClick={() => navigate("/admin/students")}
                    className="px-6 py-3 md:px-8 md:py-3 rounded-xl text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors uppercase tracking-widest hidden md:block"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading || isBatchesLoading}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-brand-cerulean text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-prussian transition-all shadow-lg shadow-brand-cerulean/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Registering..." : "Create Account"}
                </button>
            </div>

        </form>
      </div>
  );
}

// --- REUSABLE INPUT COMPONENT ---
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon, className, ...props }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">
            {label}
        </label>
        <div className="relative group">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-brand-cerulean transition-colors">
                    {icon}
                </div>
            )}
            <input
                {...props}
                className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all text-gray-800 placeholder:text-gray-300 text-sm font-medium`}
            />
        </div>
    </div>
);