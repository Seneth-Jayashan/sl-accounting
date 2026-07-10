import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    ChevronLeftIcon,
    EyeIcon,
    EyeSlashIcon,
    ChevronDownIcon
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
        <div className="w-full space-y-6 pb-20 overflow-x-hidden">

            {/* --- Header --- */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={() => navigate("/admin/students")}
                    className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shrink-0"
                >
                    <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Register Student</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

                {/* 1. PERSONAL DETAILS */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-[13px] font-black text-[#0d4b5b] mb-6 uppercase tracking-widest">
                        Personal Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <InputField
                            label="First Name"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleProfileChange}
                            required
                            placeholder="E.g. Sahan"
                        />
                        <InputField
                            label="Last Name"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleProfileChange}
                            required
                            placeholder="E.g. Perera"
                        />
                        <InputField
                            label="Phone Number"
                            name="phoneNumber"
                            value={profileData.phoneNumber}
                            onChange={handleProfileChange}
                            placeholder="E.g. 071 210 1293"
                        />

                        {/* Batch Selection */}
                        <div className="space-y-1.5">
                            <label className="block text-[13px] font-bold text-gray-800">Assigned Batch</label>
                            <div className="relative">
                                <select
                                    name="batch"
                                    value={profileData.batch}
                                    onChange={handleProfileChange}
                                    disabled={isBatchesLoading}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 outline-none transition-all appearance-none cursor-pointer text-gray-600 font-medium text-sm"
                                >
                                    <option value="" disabled>{isBatchesLoading ? "Loading..." : "Select Batch"}</option>
                                    {batches.map(b => (<option key={b._id} value={b._id}>{b.name}</option>))}
                                </select>
                                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d4b5b] pointer-events-none stroke-[2.5]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. RESIDENTIAL ADDRESS */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-[13px] font-black text-[#0d4b5b] mb-6 uppercase tracking-widest">
                        Residential Address
                    </h2>

                    <div className="space-y-5 md:space-y-6">
                        <InputField
                            label="Street Address"
                            name="street"
                            value={profileData.address.street}
                            onChange={handleAddressChange}
                            placeholder="E.g. No.123 / Main street"
                            className="w-full"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                            <InputField
                                label="City"
                                name="city"
                                value={profileData.address.city}
                                onChange={handleAddressChange}
                                placeholder="E.g. Matara"
                            />
                            <InputField
                                label="State"
                                name="state"
                                value={profileData.address.state}
                                onChange={handleAddressChange}
                                placeholder="E.g. Southern"
                            />
                            <InputField
                                label="Zip Code"
                                name="zipCode"
                                value={profileData.address.zipCode}
                                onChange={handleAddressChange}
                                placeholder="E.g. 81400"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. ACCOUNT CREDENTIALS */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-[13px] font-black text-[#0d4b5b] mb-6 uppercase tracking-widest">
                        Account Credentials
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="E.g. abcd@gmail.com"
                            value={authData.email}
                            onChange={handleAuthChange}
                            required
                        />

                        <div className="space-y-1.5">
                            <label className="block text-[13px] font-bold text-gray-800">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={authData.password}
                                    onChange={handleAuthChange}
                                    required
                                    placeholder="Min 6 characters"
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all text-gray-600 placeholder:text-gray-300 text-sm font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0d4b5b] transition-colors"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Form Actions --- */}
                <div className="flex items-center justify-center gap-4 pt-4 pb-10">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/students")}
                        className="px-6 py-2.5 rounded-xl bg-[#eef2f6] text-[#0d4b5b] font-bold text-sm hover:bg-[#e2e8f0] transition-colors min-w-[120px]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isBatchesLoading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0d4b5b] text-white font-bold text-sm hover:bg-[#093946] transition-colors shadow-sm shadow-[#0d4b5b]/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-w-[150px]"
                    >
                        {isLoading ? "Creating..." : "Create Account"}
                    </button>
                </div>

            </form>
        </div>
    );
}

// --- REUSABLE INPUT COMPONENT ---
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, className, ...props }) => (
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