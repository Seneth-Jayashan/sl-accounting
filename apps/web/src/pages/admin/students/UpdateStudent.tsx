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
    CalendarIcon,
    ChevronDownIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    SparklesIcon,
    CheckIcon,
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

const InputField: React.FC<InputFieldProps> = ({
    label,
    icon,
    className = "",
    required,
    ...props
}) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative group">
            {icon && (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-brand-cerulean transition-colors">
                    {icon}
                </div>
            )}
            <input
                required={required}
                {...props}
                className={`w-full ${icon ? "pl-10" : "pl-4"
                    } pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium`}
            />
        </div>
    </div>
);

const LoadingSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse pb-16">
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        <div className="space-y-2">
            <div className="h-7 w-52 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-72 bg-white rounded-2xl border border-slate-100" />
        <div className="h-48 bg-white rounded-2xl border border-slate-100" />
        <div className="h-56 bg-white rounded-2xl border border-slate-100" />
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

    // Saving States
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Password visibility
    const [showPasswords, setShowPasswords] = useState(false);

    // 1. Profile Data
    const [profileData, setProfileData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        batch: "",
        address: { street: "", city: "", state: "", zipCode: "" } as AddressData,
    });

    // 2. Email Data
    const [emailData, setEmailData] = useState({ currentEmail: "", newEmail: "" });

    // 3. Password Data
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    // --- Initial Data Load ---
    useEffect(() => {
        let isMounted = true;

        if (currentUser && currentUser.role !== "admin") {
            navigate("/unauthorized");
            return;
        }

        const loadData = async () => {
            if (!id) return;
            setIsLoading(true);

            try {
                const [userRes, batchRes] = await Promise.all([
                    AdminService.getUserById(id),
                    BatchService.getAllBatches(true),
                ]);

                if (isMounted) {
                    if (batchRes.batches) setBatches(batchRes.batches);

                    const user = userRes.user;
                    if (user) {
                        let parsedAddress: AddressData = {
                            street: "",
                            city: "",
                            state: "",
                            zipCode: "",
                        };

                        if (typeof user.address === "object" && user.address !== null) {
                            parsedAddress = {
                                street: (user.address as any).street || "",
                                city: (user.address as any).city || "",
                                state: (user.address as any).state || "",
                                zipCode: (user.address as any).zipCode || "",
                            };
                        } else if (typeof user.address === "string") {
                            parsedAddress.street = user.address;
                        }

                        setProfileData({
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            phoneNumber: user.phoneNumber || "",
                            batch:
                                typeof user.batch === "object"
                                    ? (user.batch as any)._id
                                    : user.batch || "",
                            address: parsedAddress,
                        });

                        setEmailData((prev) => ({ ...prev, currentEmail: user.email }));
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
        return () => {
            isMounted = false;
        };
    }, [id, currentUser, navigate]);

    // --- Handlers ---

    const handleProfileChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({
            ...prev,
            address: { ...prev.address, [name]: value },
        }));
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
        let generated = "";
        for (let i = 0; i < 10; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPasswordData({ newPassword: generated, confirmPassword: generated });
        setShowPasswords(true);
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
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });
        } catch (err: any) {
            console.error(err);
            Swal.fire(
                "Update Failed",
                err.response?.data?.message || "Server error.",
                "error"
            );
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
            title: "Change Email?",
            text: `Changing this will prevent the student from logging in with ${emailData.currentEmail}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d97706",
            confirmButtonText: "Yes, change it",
        });

        if (result.isConfirmed) {
            setSavingEmail(true);
            try {
                await AdminService.updateUserEmail(id, emailData.newEmail);
                setEmailData({ currentEmail: emailData.newEmail, newEmail: "" });
                Swal.fire("Success", "Email address updated successfully.", "success");
            } catch (err: any) {
                Swal.fire(
                    "Error",
                    err.response?.data?.message || "Failed to update email.",
                    "error"
                );
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
            Swal.fire(
                "Weak Password",
                "Password must be at least 6 characters.",
                "warning"
            );
            return;
        }

        setSavingPassword(true);
        try {
            await AdminService.updateUserPassword(id, passwordData.newPassword);
            setPasswordData({ newPassword: "", confirmPassword: "" });
            Swal.fire(
                "Success",
                "Password reset successfully. Notify the student.",
                "success"
            );
        } catch (err: any) {
            Swal.fire(
                "Error",
                err.response?.data?.message || "Failed to reset password.",
                "error"
            );
        } finally {
            setSavingPassword(false);
        }
    };

    const passwordsMatch =
        passwordData.confirmPassword.length > 0 &&
        passwordData.newPassword === passwordData.confirmPassword;
    const passwordsMismatch =
        passwordData.confirmPassword.length > 0 &&
        passwordData.newPassword !== passwordData.confirmPassword;

    // --- Render ---
    if (isLoading) return <LoadingSkeleton />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-16">
            {/* HEADER */}
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => navigate(`/admin/students/${id}`)}
                    className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Profile
                </button>

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
                        Manage Student
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Editing account details for{" "}
                        <strong className="text-brand-prussian">
                            {profileData.firstName} {profileData.lastName}
                        </strong>
                    </p>
                </div>
            </div>

            {/* 1. PROFILE SECTION */}
            <form
                onSubmit={handleUpdateProfile}
                className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/70"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                            <UserCircleIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-brand-prussian">
                                Profile Details
                            </h2>
                            <p className="text-xs text-slate-400">
                                Personal info, batch assignment, and residential address
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {savingProfile ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckIcon className="w-4 h-4" />
                        )}
                        <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                        label="First Name"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        required
                    />
                    <InputField
                        label="Last Name"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        required
                    />
                    <InputField
                        label="Phone Number"
                        name="phoneNumber"
                        value={profileData.phoneNumber}
                        onChange={handleProfileChange}
                        icon={<PhoneIcon className="w-4 h-4" />}
                        placeholder="077 123 4567"
                    />

                    {/* Batch Selection */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Assigned Batch
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                name="batch"
                                value={profileData.batch}
                                onChange={handleProfileChange}
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium text-sm"
                            >
                                <option value="" disabled>
                                    Select Batch
                                </option>
                                {batches.map((b) => (
                                    <option key={b._id} value={b._id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Address Sub-Section */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPinIcon className="w-4 h-4 text-brand-cerulean" />
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Residential Address
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="Street Address"
                            name="street"
                            value={profileData.address.street}
                            onChange={handleAddressChange}
                            placeholder="No. 123, Main Street"
                            className="md:col-span-2"
                        />
                        <InputField
                            label="City"
                            name="city"
                            value={profileData.address.city}
                            onChange={handleAddressChange}
                            placeholder="Galle"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Province / State"
                                name="state"
                                value={profileData.address.state}
                                onChange={handleAddressChange}
                                placeholder="Western"
                            />
                            <InputField
                                label="Zip Code"
                                name="zipCode"
                                value={profileData.address.zipCode}
                                onChange={handleAddressChange}
                                placeholder="10200"
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* 2. EMAIL MANAGEMENT */}
            <form
                onSubmit={handleUpdateEmail}
                className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/70"
            >
                <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 flex items-center justify-center shrink-0">
                        <EnvelopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-brand-prussian">
                            Email Management
                        </h2>
                        <p className="text-xs text-slate-400">
                            Update the student's login email address
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Current Email
                        </label>
                        <div className="w-full px-4 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-slate-500 font-mono text-sm break-all">
                            {emailData.currentEmail}
                        </div>
                    </div>

                    <InputField
                        label="New Email Address"
                        name="newEmail"
                        type="email"
                        placeholder="Enter new email..."
                        icon={<EnvelopeIcon className="w-4 h-4" />}
                        value={emailData.newEmail}
                        onChange={(e) =>
                            setEmailData({ ...emailData, newEmail: e.target.value })
                        }
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={savingEmail || !emailData.newEmail}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {savingEmail && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                        <span>{savingEmail ? "Updating..." : "Update Email Address"}</span>
                    </button>
                </div>
            </form>

            {/* 3. PASSWORD RESET */}
            <form
                onSubmit={handleUpdatePassword}
                className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/70"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 flex items-center justify-center shrink-0">
                            <KeyIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-brand-prussian">
                                Security Reset
                            </h2>
                            <p className="text-xs text-slate-400">
                                Force-reset the student's portal password
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={generatePassword}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-brand-aliceBlue text-brand-cerulean hover:bg-brand-cerulean hover:text-white text-xs font-semibold transition-colors"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Generate Strong Password
                    </button>
                </div>

                <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200/70 mb-6 flex items-start gap-3">
                    <ShieldExclamationIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-800 leading-relaxed">
                        <strong>Admin Override:</strong> This will immediately replace the
                        student's password and log them out of all active sessions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                name="newPassword"
                                type={showPasswords ? "text" : "password"}
                                placeholder="Min. 6 characters"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                                }
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-cerulean"
                                title={showPasswords ? "Hide password" : "Show password"}
                            >
                                {showPasswords ? (
                                    <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                    <EyeIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Confirm Password
                        </label>
                        <input
                            name="confirmPassword"
                            type={showPasswords ? "text" : "password"}
                            placeholder="Retype password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                                setPasswordData({
                                    ...passwordData,
                                    confirmPassword: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                        />
                        {passwordsMismatch && (
                            <p className="text-[11px] font-medium text-rose-600">
                                Passwords do not match.
                            </p>
                        )}
                        {passwordsMatch && (
                            <p className="text-[11px] font-medium text-emerald-600">
                                Passwords match.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={savingPassword || !passwordData.newPassword || passwordsMismatch}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {savingPassword && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                        <span>{savingPassword ? "Resetting..." : "Reset Password"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}