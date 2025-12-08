import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";

// Define Interface for Class Data
interface ClassData {
  _id: string;
  className: string;
  subject: string;
  batch: string;
  fee: number;
  description?: string;
  scheduleDay: string;
  scheduleTime: string;
  coverImage?: string;
  studentCount?: number; // Optional mock field
  createdAt: string;
}

export default function ViewClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Class Data
  useEffect(() => {
    if (!id) return;

    const fetchClass = async () => {
      setIsLoading(true);
      try {
        const data = await ClassService.getClassById(id);
        if (data.success && data.class) {
          setClassData(data.class);
        } else {
          setError("Class not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch class details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClass();
  }, [id]);

  // 2. Handle Delete
  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure? This will remove the class and unenroll students.")) return;

    try {
      await ClassService.deleteClass(id);
      navigate("/admin/classes");
    } catch (err) {
      alert("Failed to delete class.");
    }
  };

  // --- Right Sidebar (Actions) ---
  const ActionSidebar = (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Class Actions</h3>
        <button 
          onClick={() => navigate(`/admin/classes/edit/${id}`)} // You'll create this route later
          className="w-full flex items-center justify-center gap-2 bg-[#0b2540] text-white py-2.5 rounded-xl mb-3 hover:bg-[#153454] transition-colors"
        >
          <PencilSquareIcon className="w-5 h-5" /> Edit Details
        </button>
        <button 
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 bg-white text-red-600 border border-red-100 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
        >
          <TrashIcon className="w-5 h-5" /> Delete Class
        </button>
      </div>

      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">Quick Stats</h3>
        <div className="flex justify-between items-center text-sm text-blue-700 mb-2">
          <span>Active Students</span>
          <span className="font-bold">{classData?.studentCount || 0}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-blue-700">
          <span>Monthly Revenue</span>
          <span className="font-bold">LKR {((classData?.studentCount || 0) * (classData?.fee || 0)).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  // --- Loading / Error States ---
  if (isLoading) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="flex h-screen items-center justify-center text-gray-400 animate-pulse">
          Loading Class...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-800">Error</h2>
          <p className="text-gray-500">{error || "Class not found"}</p>
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
          onClick={() => navigate("/admin/classes")} // Or navigate(-1)
          className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Classes
        </button>

        {/* HERO BANNER */}
        <div className="relative w-full h-48 sm:h-64 rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
          {/* Background Image */}
          {classData.coverImage ? (
             <img 
               src={classData.coverImage} 
               alt={classData.className} 
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
          ) : (
             <div className="w-full h-full bg-gradient-to-r from-[#0b2540] to-[#1a3b5c] flex items-center justify-center">
                <AcademicCapIcon className="w-20 h-20 text-white/20" />
             </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          {/* Title & Batch Badges */}
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500/20 backdrop-blur-md text-blue-100 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                    {classData.subject}
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1 rounded-full text-xs font-semibold">
                    {classData.batch}
                </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {classData.className}
            </h1>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
               <CalendarDaysIcon className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 font-medium">Schedule</p>
               <p className="text-lg font-bold text-gray-900">{classData.scheduleDay}</p>
               <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                 <ClockIcon className="w-4 h-4" />
                 {classData.scheduleTime}
               </div>
             </div>
          </div>

          {/* Card 2: Fees */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
               <CurrencyDollarIcon className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 font-medium">Monthly Fee</p>
               <p className="text-lg font-bold text-gray-900">LKR {classData.fee}</p>
               <p className="text-xs text-emerald-600 font-medium mt-1">Per Student</p>
             </div>
          </div>

          {/* Card 3: Location / Type (Mock) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <MapPinIcon className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 font-medium">Location</p>
               <p className="text-lg font-bold text-gray-900">Main Hall</p>
               <p className="text-xs text-blue-600 font-medium mt-1">Physical Class</p>
             </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 mb-4">About this Class</h2>
           <div className="prose prose-sm text-gray-600 max-w-none">
             {classData.description ? (
                <p>{classData.description}</p>
             ) : (
                <p className="italic text-gray-400">No description provided for this class.</p>
             )}
           </div>
        </div>

        {/* Placeholder for Enrollments */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 opacity-60">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                 <UserGroupIcon className="w-5 h-5 text-gray-400" /> 
                 Recent Enrollments
              </h2>
              <button className="text-sm text-[#0b2540] font-medium hover:underline">View All</button>
           </div>
           <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400">Student enrollment list will appear here.</p>
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
}