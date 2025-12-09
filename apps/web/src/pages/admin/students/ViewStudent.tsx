import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import UserService from "../../../services/userService";
import type { User } from "../../../contexts/AuthContext";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

// Define a type that extends User to include student specific fields
interface StudentProfile extends User {
  regNo?: string;
  batch?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export default function ViewStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const data = await UserService.getUserById(id);
        if (data.success) {
          setStudent(data.user as StudentProfile);
        } else {
          setError("User not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch student details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    if(!window.confirm("Are you sure you want to delete this student?")) return;
    // Add delete logic here via UserService
    alert("Delete functionality to be implemented");
  };

  // --- Right Sidebar for this page ---
  const ActionSidebar = (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
        <button 
          onClick={() => navigate(`/admin/students/edit/${id}`)}
          className="w-full flex items-center justify-center gap-2 bg-[#0b2540] text-white py-2.5 rounded-xl mb-3 hover:bg-[#153454] transition-colors"
        >
          <PencilSquareIcon className="w-5 h-5" /> Edit Profile
        </button>
        <button 
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 bg-white text-red-600 border border-red-100 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
        >
          <TrashIcon className="w-5 h-5" /> Delete User
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="flex h-screen items-center justify-center text-gray-400 animate-pulse">
          Loading Profile...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-800">Error</h2>
          <p className="text-gray-500">{error || "Student not found"}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#0b2540] underline">Go Back</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={ActionSidebar}>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Directory
        </button>

        {/* PROFILE HEADER CARD */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          {/* Background Decorative Element */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#0b2540] to-[#1a3b5c] opacity-100"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-6 pt-12 px-2">
            
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
               {student.profileImage ? (
                  <img src={typeof student.profileImage === 'string' ? student.profileImage : ''} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-3xl font-bold text-blue-600">
                    {student.firstName?.[0]}
                  </div>
               )}
            </div>

            {/* Name & Badge */}
            <div className="flex-1 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                 <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100">
                    {student.batch || "Student"}
                 </span>
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${student.isVerified ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                    {student.isVerified ? "Active Account" : "Pending Verification"}
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Personal Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-gray-400" /> Personal Details
            </h2>
            <div className="space-y-4">
              <DetailRow label="First Name" value={student.firstName} />
              <DetailRow label="Last Name" value={student.lastName} />
              <DetailRow label="Registration No" value={student.regNo} />
              <DetailRow label="Joined Date" value={new Date(student.createdAt || Date.now()).toLocaleDateString()} />
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" /> Contact Information
            </h2>
            <div className="space-y-4">
              <DetailRow label="Email Address" value={student.email} icon={<EnvelopeIcon className="w-4 h-4"/>} />
              <DetailRow label="Phone Number" value={student.phoneNumber} icon={<PhoneIcon className="w-4 h-4"/>} />
              <DetailRow label="Address" value={student.address} />
            </div>
          </div>

           {/* Section 3: Academic/Batch Info */}
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-gray-400" /> Academic Info
            </h2>
            <div className="space-y-4">
              <DetailRow label="Current Batch" value={student.batch} />
              <DetailRow label="Fees Status" value="Paid (Demo)" /> {/* Mock Data for now */}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

// Simple Helper Component for Rows
const DetailRow = ({ label, value, icon }: { label: string, value?: string, icon?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm text-gray-900 font-semibold flex items-center gap-2 mt-1 sm:mt-0">
      {icon && <span className="text-gray-400">{icon}</span>}
      {value || "Not Provided"}
    </span>
  </div>
);