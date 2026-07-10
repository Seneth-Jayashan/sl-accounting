import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    ChevronLeftIcon,
    ChevronDownIcon,
    EyeIcon,
    EyeSlashIcon
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
}

const InputField: React.FC<InputFieldProps> = ({ label, className = "", ...props }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="block text-[13px] font-bold text-gray-800">
            {label}
        </label>
        <div className="relative">
            <input
                {...props}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all text-gray-600 placeholder:text-gray-300 text-sm font-medium`}
            />
        </div>
    </div>
);

const LoadingSkeleton = () => (
    <div className="w-full space-y-6 animate-pulse pb-10">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
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

    // Show Password State
    const [showNewPassword, setShowNewPassword] = useState(false);

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
            confirmButtonText: 'Yes, change it',
            confirmButtonColor: '#0d4b5b'
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
        <div className="w-full space-y-6 pb-20 overflow-x-hidden">

            {/* Header */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={() => navigate(`/admin/students/${id}`)}
                    className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shrink-0"
                >
                    <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Manage Student</h1>
            </div>

            {/* 1. PROFILE SECTION (Combined Form for Profile & Address) */}
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-4xl">

                {/* Profile Details Card */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[13px] font-black text-[#0d4b5b] uppercase tracking-widest">
                            Profile Details
                        </h2>
                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="flex items-center justify-center px-5 py-2 rounded-xl bg-[#0d4b5b] text-white font-bold text-xs hover:bg-[#093946] transition-colors shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {savingProfile ? "Saving..." : "Save Profile"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <InputField label="First Name" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required placeholder="E.g. Sahan" />
                        <InputField label="Last Name" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required placeholder="E.g. Perera" />
                        <InputField label="Phone Number" name="phoneNumber" value={profileData.phoneNumber} onChange={handleProfileChange} placeholder="E.g. 071 210 1293" />

                        {/* Batch Selection */}
                        <div className="space-y-1.5">
                            <label className="block text-[13px] font-bold text-gray-800">Assigned Batch</label>
                            <div className="relative">
                                <select
                                    name="batch"
                                    value={profileData.batch}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all appearance-none cursor-pointer text-gray-600 font-medium text-sm"
                                >
                                    <option value="" disabled>Select Batch</option>
                                    {batches.map(b => (<option key={b._id} value={b._id}>{b.name}</option>))}
                                </select>
                                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d4b5b] pointer-events-none stroke-[2.5]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Residential Address Card */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-[13px] font-black text-[#0d4b5b] mb-6 uppercase tracking-widest">
                        Residential Address
                    </h2>
                    <div className="space-y-5 md:space-y-6">
                        <InputField label="Street Address" name="street" value={profileData.address.street} onChange={handleAddressChange} placeholder="E.g. No.123 / Main street" className="w-full" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                            <InputField label="City" name="city" value={profileData.address.city} onChange={handleAddressChange} placeholder="E.g. Matara" />
                            <InputField label="State" name="state" value={profileData.address.state} onChange={handleAddressChange} placeholder="E.g. Southern" />
                            <InputField label="Zip Code" name="zipCode" value={profileData.address.zipCode} onChange={handleAddressChange} placeholder="E.g. 81400" />
                        </div>
                    </div>
                </div>
            </form>

            {/* 2. EMAIL MANAGEMENT */}
            <form onSubmit={handleUpdateEmail} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl">
                <h2 className="text-[13px] font-black text-[#0d4b5b] mb-6 uppercase tracking-widest">
                    Email Management
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-end">
                    <div className="space-y-1.5">
                        <label className="block text-[13px] font-bold text-gray-800">Current Email</label>
                        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 font-medium text-sm break-all">
                            {emailData.currentEmail}
                        </div>
                    </div>

                    <InputField
                        label="New Email Address"
                        name="newEmail"
                        type="email"
                        placeholder="Enter new email"
                        value={emailData.newEmail}
                        onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={savingEmail || !emailData.newEmail}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#0d4b5b] text-white font-bold hover:bg-[#093946] transition-colors shadow-sm text-xs active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {savingEmail ? "Updating..." : "Update Email Address"}
                    </button>
                </div>
            </form>

            {/* 3. PASSWORD RESET */}
            <form onSubmit={handleUpdatePassword} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl">
                <h2 className="text-[13px] font-black text-[#0d4b5b] mb-6 uppercase tracking-widest">
                    Security Reset
                </h2>

                <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6">
                    <p className="text-[11px] text-red-600 leading-relaxed font-medium">
                        Admin Override: This will forcibly reset the student's password. They will be logged out of all devices immediately.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    {/* Custom New Password Field with Eye Toggle */}
                    <div className="space-y-1.5">
                        <label className="block text-[13px] font-bold text-gray-800">New Password</label>
                        <div className="relative">
                            <input
                                name="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Min 6 characters"
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all text-gray-600 placeholder:text-gray-300 text-sm font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0d4b5b] transition-colors"
                            >
                                {showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <InputField
                        label="Confirm password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Retype password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={savingPassword || !passwordData.newPassword}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#0d4b5b] text-white font-bold hover:bg-[#093946] transition-colors shadow-sm text-xs active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {savingPassword ? "Resetting..." : "Reset Password"}
                    </button>
                </div>
            </form>

        </div>
    );
}