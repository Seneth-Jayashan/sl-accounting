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
    CalendarIcon,
    ChevronDownIcon,
    ArrowPathIcon,
    SparklesIcon,
    UserPlusIcon,
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
        address: { street: "", city: "", state: "", zipCode: "" } as AddressData,
    });

    const [authData, setAuthData] = useState({
        email: "",
        password: "",
    });

    // --- Initial Data Load ---
    useEffect(() => {
        let isMounted = true;
        const loadBatches = async () => {
            try {
                const response = await BatchService.getAllBatches(true);
                if (isMounted && response.batches && response.batches.length > 0) {
                    setBatches(response.batches);
                    setProfileData((prev) => ({ ...prev, batch: response.batches![0]._id }));
                }
            } catch (err) {
                console.error("Failed to load batches", err);
                Swal.fire("Warning", "Failed to load active batches.", "warning");
            } finally {
                if (isMounted) setIsBatchesLoading(false);
            }
        };
        loadBatches();
        return () => {
            isMounted = false;
        };
    }, []);

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

    const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAuthData((prev) => ({ ...prev, [name]: value }));
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
        let generated = "";
        for (let i = 0; i < 10; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setAuthData((prev) => ({ ...prev, password: generated }));
        setShowPassword(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (authData.password.length < 6) {
                throw new Error("Password must be at least 6 characters long.");
            }
            if (!profileData.batch) {
                throw new Error("Please select a valid batch.");
            }

            const payload = {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phoneNumber: profileData.phoneNumber,
                batch: profileData.batch,
                address: profileData.address,
                email: authData.email,
                password: authData.password,
                role: "student" as const,
            };

            await AdminService.createUser(payload);

            Swal.fire({
                title: "Student Registered",
                text: "Account created successfully!",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            navigate("/admin/students");
        } catch (err: any) {
            console.error(err);
            Swal.fire(
                "Registration Failed",
                err.response?.data?.message || err.message,
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordValid = authData.password.length >= 6;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-16">
            {/* HEADER */}
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => navigate("/admin/students")}
                    className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Directory
                </button>

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
                        Register New Student
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Create a student profile, assign a batch, and set up login credentials.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. PERSONAL DETAILS */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/70">
                    <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                            <UserCircleIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-brand-prussian">
                                Personal Details
                            </h2>
                            <p className="text-xs text-slate-400">
                                Basic student information and batch assignment
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            label="First Name"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleProfileChange}
                            required
                            placeholder="e.g. Sahan"
                        />
                        <InputField
                            label="Last Name"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleProfileChange}
                            required
                            placeholder="e.g. Perera"
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
                                Assigned Batch <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    name="batch"
                                    value={profileData.batch}
                                    onChange={handleProfileChange}
                                    disabled={isBatchesLoading}
                                    required
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium text-sm disabled:opacity-60"
                                >
                                    <option value="" disabled>
                                        {isBatchesLoading ? "Loading batches..." : "Select Batch"}
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
                            <span className="text-[11px] text-slate-400 font-normal">
                                (Optional)
                            </span>
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
                </section>

                {/* 2. ACCOUNT CREDENTIALS */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/70">
                    <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                            <LockClosedIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-brand-prussian">
                                Account Credentials
                            </h2>
                            <p className="text-xs text-slate-400">
                                Login email and initial password for the student portal
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="student@example.com"
                            value={authData.email}
                            onChange={handleAuthChange}
                            required
                            icon={<EnvelopeIcon className="w-4 h-4" />}
                        />

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Password <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    Generate
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-brand-cerulean transition-colors">
                                    <LockClosedIcon className="w-4 h-4" />
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={authData.password}
                                    onChange={handleAuthChange}
                                    required
                                    placeholder="Min. 6 characters"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-cerulean transition-colors"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-4 h-4" />
                                    ) : (
                                        <EyeIcon className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {authData.password.length > 0 && (
                                <p
                                    className={`text-[11px] font-medium ${isPasswordValid ? "text-emerald-600" : "text-amber-600"
                                        }`}
                                >
                                    {isPasswordValid
                                        ? "Password length looks good"
                                        : `${6 - authData.password.length} more character(s) required`}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ACTION BAR */}
                <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex items-center justify-end gap-3 z-40 md:z-auto">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/students")}
                        disabled={isLoading}
                        className="hidden md:inline-flex px-6 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isBatchesLoading}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span>Registering...</span>
                            </>
                        ) : (
                            <>
                                <UserPlusIcon className="w-4 h-4" />
                                <span>Create Student Account</span>
                            </>
                        )}
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