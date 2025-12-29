import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldExclamationIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

// --- SERVICES ---
import AdminService from "../../../services/AdminService"; 
import BatchService, { type BatchData } from "../../../services/BatchService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Types ---
interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// --- SUB-COMPONENT: Input Field ---
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#0b2540] transition-colors">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/10 focus:border-[#0b2540] outline-none transition-all text-gray-800 placeholder:text-gray-300 text-sm font-medium`}
      />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-pulse">
    <div className="h-8 w-32 md:w-48 bg-gray-200 rounded-lg"></div>
    <div className="h-64 bg-gray-200 rounded-3xl"></div>
    <div className="h-48 bg-gray-200 rounded-3xl"></div>
    <div className="h-48 bg-gray-200 rounded-3xl"></div>
  </div>
);

// --- MAIN COMPONENT ---

export default function UpdateStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<BatchData[]>([]);

  // Loading States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // 1. Profile Data
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    batch: "", 
    address: { street: "", city: "", state: "", zipCode: "" } as AddressData
  });

  // 2. Email Data
  const [emailData, setEmailData] = useState({ currentEmail: "", newEmail: "" });

  // 3. Password Data
  const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });

  // --- Initial Data Load ---
  useEffect(() => {
    let isMounted = true;

    // Security Check: Only Admin Allowed
    if (currentUser && currentUser.role !== 'admin') {
        navigate('/unauthorized');
        return;
    }

    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);

      try {
        const [userRes, batchRes] = await Promise.all([
            AdminService.getUserById(id),
            BatchService.getAllBatches(true)
        ]);

        if (isMounted) {
            if (batchRes.batches) setBatches(batchRes.batches);

            const user = userRes.user;
            if (user) {
                // Safe Address Parsing
                let parsedAddress: AddressData = { street: "", city: "", state: "", zipCode: "" };
                
                if (typeof user.address === 'object' && user.address !== null) {
                    parsedAddress = {
                        street: (user.address as any).street || "",
                        city: (user.address as any).city || "",
                        state: (user.address as any).state || "",
                        zipCode: (user.address as any).zipCode || ""
                    };
                } else if (typeof user.address === 'string') {
                    parsedAddress.street = user.address;
                }

                setProfileData({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    phoneNumber: user.phoneNumber || "",
                    // Handle populated object vs ID string
                    batch: typeof user.batch === 'object' ? (user.batch as any)._id : user.batch || "",
                    address: parsedAddress
                });

                setEmailData(prev => ({ ...prev, currentEmail: user.email }));
            } else {
                throw new Error("Student not found");
            }
        }
      } catch (err) {
        console.error("Load Error:", err);
        Swal.fire("Error", "Failed to load student data.", "error");
        navigate(-1);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [id, currentUser, navigate]);

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

  // 1. Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("firstName", profileData.firstName);
      formData.append("lastName", profileData.lastName);
      formData.append("phoneNumber", profileData.phoneNumber);
      formData.append("batch", profileData.batch);
      formData.append("address", JSON.stringify(profileData.address));

      await AdminService.updateUserProfile(id, formData);
      
      Swal.fire({
          title: "Profile Updated",
          icon: "success",
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire("Update Failed", err.response?.data?.message || "Server error.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Update Email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!emailData.newEmail) {
        Swal.fire("Input Required", "Please enter a new email address.", "warning");
        return;
    }

    const result = await Swal.fire({
        title: 'Change Email?',
        text: `Changing this will prevent the student from logging in with ${emailData.currentEmail}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, change it'
    });

    if (result.isConfirmed) {
        setSavingEmail(true);
        try {
            await AdminService.updateUserEmail(id, emailData.newEmail);
            setEmailData({ currentEmail: emailData.newEmail, newEmail: "" });
            Swal.fire("Success", "Email address updated successfully.", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.message || "Failed to update email.", "error");
        } finally {
            setSavingEmail(false);
        }
    }
  };

  // 3. Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
        Swal.fire("Mismatch", "Passwords do not match.", "error");
        return;
    }

    if (passwordData.newPassword.length < 6) {
        Swal.fire("Weak Password", "Password must be at least 6 characters.", "warning");
        return;
    }

    setSavingPassword(true);
    try {
        await AdminService.updateUserPassword(id, passwordData.newPassword);
        setPasswordData({ newPassword: "", confirmPassword: "" });
        Swal.fire("Success", "Password reset successfully. Notify the student.", "success");
    } catch (err: any) {
        Swal.fire("Error", err.response?.data?.message || "Failed to reset password.", "error");
    } finally {
        setSavingPassword(false);
    }
  };

  // --- Render ---
  if (isLoading) return <LoadingSkeleton />;

  return (
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 font-sans pb-24 md:pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <button 
                onClick={() => navigate(`/admin/students/${id}`)} 
                className="group flex items-center text-gray-500 hover:text-[#0b2540] transition-colors font-medium text-xs md:text-sm uppercase tracking-widest"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                Back to Profile
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manage Student</h1>
        </div>

        {/* 1. PROFILE SECTION */}
        <form onSubmit={handleUpdateProfile} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-sm md:text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                    <UserCircleIcon className="w-5 h-5 text-brand-cerulean" /> Profile Details
                </h2>
                <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0b2540] text-white font-bold hover:bg-[#153454] transition-all text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50"
                >
                    {savingProfile ? "Saving..." : "Save Profile"}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <InputField label="First Name" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required />
                <InputField label="Last Name" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required />
                <InputField label="Phone Number" name="phoneNumber" value={profileData.phoneNumber} onChange={handleProfileChange} icon={<PhoneIcon className="w-4 h-4 text-gray-400"/>} />
                
                {/* Batch Selection */}
                <div className="space-y-1.5">
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Assigned Batch</label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select 
                            name="batch" 
                            value={profileData.batch} 
                            onChange={handleProfileChange} 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/10 outline-none transition-all appearance-none cursor-pointer text-gray-700 font-medium text-sm"
                        >
                            <option value="" disabled>Select Batch</option>
                            {batches.map(b => (<option key={b._id} value={b._id}>{b.name}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Address Sub-Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
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
        </form>

        {/* 2. EMAIL MANAGEMENT */}
        <form onSubmit={handleUpdateEmail} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 uppercase tracking-wide">
                <EnvelopeIcon className="w-5 h-5 text-brand-cerulean" /> Email Management
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-end">
                <div className="space-y-1.5">
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Current Email</label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-mono text-sm break-all">
                        {emailData.currentEmail}
                    </div>
                </div>
                
                <InputField 
                    label="New Email Address" 
                    name="newEmail" 
                    type="email"
                    placeholder="Enter new email..."
                    value={emailData.newEmail} 
                    onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})} 
                />
            </div>
            
            <div className="mt-6 flex justify-end">
                <button
                    type="submit"
                    disabled={savingEmail || !emailData.newEmail}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                >
                    {savingEmail ? "Updating..." : "Update Email Address"}
                </button>
            </div>
        </form>

        {/* 3. PASSWORD RESET */}
        <form onSubmit={handleUpdatePassword} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 uppercase tracking-wide">
                <KeyIcon className="w-5 h-5 text-brand-cerulean" /> Security Reset
            </h2>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 flex items-start gap-3">
                <ShieldExclamationIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                    <strong>Admin Override:</strong> This will forcibly reset the student's password. They will be logged out of all devices immediately.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <InputField 
                    label="New Password" 
                    name="newPassword" 
                    type="password"
                    placeholder="Min 6 characters"
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                />
                <InputField 
                    label="Confirm Password" 
                    name="confirmPassword" 
                    type="password"
                    placeholder="Retype password"
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                />
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="submit"
                    disabled={savingPassword || !passwordData.newPassword}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                >
                    {savingPassword ? "Resetting..." : "Reset Password"}
                </button>
            </div>
        </form>

      </div>
  );
}