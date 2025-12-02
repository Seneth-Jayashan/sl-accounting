import React, { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  PhoneIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

// --- Types ---
type Student = {
  id: number;
  regNo: string;
  name: string;
  email: string;
  phone: string;
  batch: string; // e.g., "2024 A/L"
  status: "Active" | "Inactive" | "Pending";
  feesStatus: "Paid" | "Overdue";
  avatarColor: string;
};

// --- Mock Data ---
const studentsData: Student[] = [
  {
    id: 1,
    regNo: "STU-001",
    name: "Sahan Jay",
    email: "sahan@example.com",
    phone: "077-1234567",
    batch: "2024 A/L",
    status: "Active",
    feesStatus: "Paid",
    avatarColor: "bg-blue-100 text-blue-600"
  },
  {
    id: 2,
    regNo: "STU-002",
    name: "Kavindi Perera",
    email: "kavi.p@example.com",
    phone: "071-9876543",
    batch: "2025 A/L",
    status: "Active",
    feesStatus: "Overdue",
    avatarColor: "bg-purple-100 text-purple-600"
  },
  {
    id: 3,
    regNo: "STU-003",
    name: "Kasun Kalhara",
    email: "kasun@example.com",
    phone: "076-5554443",
    batch: "2024 A/L",
    status: "Inactive",
    feesStatus: "Paid",
    avatarColor: "bg-gray-100 text-gray-600"
  },
  {
    id: 4,
    regNo: "STU-004",
    name: "Nimali Silva",
    email: "nimali@example.com",
    phone: "070-1122334",
    batch: "2025 A/L",
    status: "Pending",
    feesStatus: "Paid",
    avatarColor: "bg-pink-100 text-pink-600"
  },
  {
    id: 5,
    regNo: "STU-005",
    name: "Udesh Indika",
    email: "udesh@example.com",
    phone: "077-8899000",
    batch: "2024 A/L",
    status: "Active",
    feesStatus: "Paid",
    avatarColor: "bg-emerald-100 text-emerald-600"
  },
];

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");

  // Filter Logic
  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "All" || student.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  // --- Right Sidebar Content ---
  const StudentStatsSidebar = (
    <div className="space-y-6">
      {/* Widget 1: Stats */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Registration Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-700">320</div>
            <div className="text-xs text-blue-600 font-medium">Total Active</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-700">+12</div>
            <div className="text-xs text-emerald-600 font-medium">New This Month</div>
          </div>
        </div>
      </div>

      {/* Widget 2: Export Tools */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">Data Management</h3>
        <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors">
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Export as CSV</span>
        </button>
        <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors">
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Export as PDF</span>
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout 
      Sidebar={SidebarAdmin} 
      BottomNav={BottomNavAdmin}
      rightSidebar={StudentStatsSidebar}
    >
      <div className="space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
            <p className="text-gray-500 text-sm mt-1">View and manage all registered students.</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-[#0b2540] hover:bg-[#1a3b5c] text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
            <PlusIcon className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, Reg No..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-700 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select 
                className="pl-10 pr-8 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-700 appearance-none cursor-pointer"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="All">All Batches</option>
                <option value="2024 A/L">2024 A/L</option>
                <option value="2025 A/L">2025 A/L</option>
                <option value="2026 A/L">2026 A/L</option>
              </select>
            </div>
          </div>
        </div>

        {/* STUDENTS TABLE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Reg No & Batch</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Fees</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/80 transition-colors group">
                    
                    {/* Name Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${student.avatarColor}`}>
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Batch Column */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{student.regNo}</div>
                      <div className="text-xs text-gray-500">{student.batch}</div>
                    </td>

                    {/* Contact Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        {student.phone}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'Active' ? 'bg-green-50 text-green-700' :
                        student.status === 'Inactive' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                           student.status === 'Active' ? 'bg-green-500' :
                           student.status === 'Inactive' ? 'bg-red-500' :
                           'bg-yellow-500'
                        }`}></span>
                        {student.status}
                      </span>
                    </td>

                     {/* Fees Column */}
                     <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                        student.feesStatus === 'Paid' ? 'bg-gray-50 border-gray-200 text-gray-600' :
                        'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        {student.feesStatus}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-[#0b2540] p-1 rounded-md hover:bg-gray-100 transition-colors">
                        <EllipsisHorizontalIcon className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <UserIcon className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No students found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination (Static) */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">Showing <span className="font-medium text-gray-900">1-5</span> of <span className="font-medium text-gray-900">320</span></div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}