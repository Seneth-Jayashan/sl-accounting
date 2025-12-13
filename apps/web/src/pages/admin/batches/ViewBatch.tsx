import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import BatchService from "../../../services/BatchService";
import type { BatchData } from "../../../services/BatchService";

import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon
} from "@heroicons/react/24/outline";

// --- Interfaces ---
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  profilePic?: string; // URL
  createdAt: string; // Registration date
}

export default function ViewBatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- State ---
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "students">("students");
  const [searchTerm, setSearchTerm] = useState("");

  // --- Fetch Data ---
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get Batch Details
        const batchRes = await BatchService.getBatchById(id);
        if (batchRes.success && batchRes.batch) {
          setBatch(batchRes.batch);
        }

        // 2. Get Students (Mocking the call if endpoint isn't ready)
        // In real app: const studentRes = await BatchService.getBatchStudents(id);
        // For now, let's pretend we got data or use an empty array if failing
        try {
           const studentRes = await BatchService.getBatchStudents(id);
           if(studentRes.users) setStudents(studentRes.users);
        } catch (e) {
           console.warn("Could not fetch students (Endpoint might be missing)", e);
           setStudents([]); 
        }

      } catch (error) {
        console.error("Error loading batch details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- Filter Students ---
  const filteredStudents = students.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Helper: Format Image ---
  const getProfileUrl = (path?: string) => {
      if (!path) return "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User";
      if (path.startsWith("http")) return path;
      return `http://localhost:5000/${path.replace(/\\/g, "/")}`; // Adjust port if needed
  };

  if (loading) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
         <div className="flex h-screen items-center justify-center text-gray-400 animate-pulse">
            Loading Batch Details...
         </div>
      </DashboardLayout>
    );
  }

  if (!batch) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
         <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-gray-700">Batch Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-blue-600 underline mt-2">Go Back</button>
         </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 p-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
           <div className="space-y-2">
              <button 
                onClick={() => navigate("/admin/batches")}
                className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors mb-2"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Batches
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{batch.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${batch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {batch.isActive ? "Active Batch" : "Archived"}
                  </span>
                  <div className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400"/>
                      {moment(batch.startDate).format("MMM YYYY")} - {moment(batch.endDate).format("MMM YYYY")}
                  </div>
              </div>
              {batch.description && <p className="text-gray-500 max-w-2xl">{batch.description}</p>}
           </div>

           {/* Stats Cards (Mini) */}
           <div className="flex gap-4">
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 min-w-[120px]">
                   <div className="text-blue-500 text-xs font-bold uppercase tracking-wide">Total Students</div>
                   <div className="text-2xl font-bold text-blue-900">{students.length}</div>
               </div>
               <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 min-w-[120px]">
                   <div className="text-purple-500 text-xs font-bold uppercase tracking-wide">Classes</div>
                   <div className="text-2xl font-bold text-purple-900">{batch.classes?.length || 0}</div>
               </div>
           </div>
        </div>

        {/* --- Tabs --- */}
        <div className="flex border-b border-gray-200">
            <button
                onClick={() => setActiveTab("students")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "students" 
                    ? "border-[#0b2540] text-[#0b2540]" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
                <UserGroupIcon className="w-4 h-4" /> Registered Students
            </button>
            <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "overview" 
                    ? "border-[#0b2540] text-[#0b2540]" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
                <AcademicCapIcon className="w-4 h-4" /> Associated Classes
            </button>
        </div>

        {/* --- Tab Content: STUDENTS --- */}
        {activeTab === "students" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Search Bar */}
                <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm max-w-md">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 ml-2" />
                    <input 
                        type="text" 
                        placeholder="Search student by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 outline-none text-sm bg-transparent"
                    />
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-16">
                            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Students Found</h3>
                            <p className="text-gray-500">No students are currently registered under this batch.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact Info</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Registered Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={getProfileUrl(student.profilePic)} 
                                                        alt="Profile" 
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-gray-900">{student.firstName} {student.lastName}</div>
                                                        <div className="text-xs text-gray-500">ID: {student._id.slice(-6).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                                                        {student.email}
                                                    </div>
                                                    {student.mobileNumber && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                                                            {student.mobileNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {moment(student.createdAt).format("MMM Do, YYYY")}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    onClick={() => navigate(`/admin/students/${student._id}`)} // Assumes you have a student detail page
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- Tab Content: OVERVIEW (Classes) --- */}
        {activeTab === "overview" && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Classes in this Batch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batch.classes && batch.classes.length > 0 ? (
                        batch.classes.map((cls: any) => (
                            <div key={cls._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/classes/${cls._id}`)}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                        <AcademicCapIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {cls.level || "General"}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">{cls.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2">{cls.description || "No description."}</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400">No classes assigned to this batch yet.</p>
                        </div>
                    )}
                </div>
             </div>
        )}

      </div>
    </DashboardLayout>
  );
}