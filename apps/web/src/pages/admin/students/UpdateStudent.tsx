import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import UserService from "../../../services/userService";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  AcademicCapIcon,
  PhoneIcon,
  IdentificationIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function UpdateStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "", // Often read-only
    phoneNumber: "",
    regNo: "",
    batch: "2024 A/L", // Default
    address: ""
  });

  // 1. Fetch Existing Data
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await UserService.getUserById(id);
        if (data.success && data.user) {
          const u = data.user as any; // Cast to access extra fields if User type is strict
          setFormData({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            email: u.email || "",
            phoneNumber: u.phoneNumber || "",
            regNo: u.regNo || "",
            batch: u.batch || "2024 A/L",
            address: u.address || ""
          });
        }
      } catch (err) {
        console.error(err);
        setError("Could not load student details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 2. Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Submit Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!id) throw new Error("No ID provided");
      
      // Call the new Admin Update method
      await UserService.updateUser(id, formData);
      
      // Navigate back to View Page on success
      navigate(`/admin/students/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update student.");
      setIsSaving(false);
    }
  };

  // Right Sidebar (Tips)
  const EditTipsSidebar = (
    <div className="space-y-4">
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">Editing Tips</h3>
        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
          <li>Ensure the <strong>Reg No</strong> is unique across the batch.</li>
          <li>Changing the <strong>Batch</strong> may affect the student's access to course materials.</li>
          <li>Email addresses cannot be changed here for security reasons.</li>
        </ul>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="flex h-screen items-center justify-center text-gray-400">
          Loading student data...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={EditTipsSidebar}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Cancel & Go Back
        </button>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Student Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Update personal details and academic information.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Personal Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-gray-400" /> Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none transition-all"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none transition-all"
                />
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email Address <span className="text-xs text-gray-400 font-normal">(Read Only)</span></label>
                <input
                  name="email"
                  value={formData.email}
                  readOnly
                  type="email"
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    type="tel"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none transition-all"
                  />
                </div>
              </div>
               
               {/* Address */}
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Home Address</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-gray-400" /> Academic Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Registration No */}
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Registration Number</label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="regNo"
                    value={formData.regNo}
                    onChange={handleChange}
                    type="text"
                    placeholder="e.g. STU-001"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Batch Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Batch / Class</label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="2024 A/L">2024 A/L</option>
                  <option value="2025 A/L">2025 A/L</option>
                  <option value="2026 A/L">2026 A/L</option>
                  <option value="2024 Revision">2024 Revision</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
             <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
             >
              Cancel
             </button>
             <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0b2540] text-white font-medium hover:bg-[#153454] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
             >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Changes
                </>
              )}
             </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}