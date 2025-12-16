import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import EnrollmentService from "../../../services/EnrollmentService";
import moment from "moment";
import {
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// --- 1. Define Strict Interfaces for this Page ---
// We explicitly define what the "Populated" data looks like
interface PopulatedStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
}

interface PopulatedClass {
  _id: string;
  name: string;
  price: number;
}

// The main Enrollment interface using the strict types above
interface Enrollment {
  _id: string;
  student: PopulatedStudent; // Strictly an object
  class: PopulatedClass;     // Strictly an object
  paymentStatus: "paid" | "unpaid" | "pending";
  createdAt: string;
  accessEndDate?: string;
}

export default function EnrollmentsPage() {
  // Use the strict 'Enrollment' type for state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // --- Fetch Data ---
  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== "all") params.paymentStatus = filterStatus;
      
      const data = await EnrollmentService.getAllEnrollments(params);
      
      // --- FIX IS HERE ---
      // We cast the data to 'unknown' first, then to our strict 'Enrollment[]' type.
      // This tells TypeScript: "I know the service definition says these might be strings, 
      // but I guarantee for this endpoint they are fully populated objects."
      setEnrollments(data as unknown as Enrollment[]);

    } catch (error) {
      console.error("Failed to load enrollments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [filterStatus]);

  // --- Actions ---
  const handleMarkPaid = async (id: string) => {
    if (!window.confirm("Confirm payment for this student? This will unlock access.")) return;
    
    try {
      await EnrollmentService.markPaymentAsPaid(id);
      // Optimistic Update
      setEnrollments(prev => prev.map(e => 
        e._id === id ? { ...e, paymentStatus: "paid" } : e
      ));
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;
    try {
      await EnrollmentService.cancelEnrollment(id);
      setEnrollments(prev => prev.filter(e => e._id !== id));
    } catch (error) {
      alert("Failed to delete enrollment");
    }
  };

  // --- Filter Logic ---
  const filteredList = enrollments.filter(e => {
    // Because we used strict types, TS knows student.firstName exists!
    const studentName = `${e.student.firstName} ${e.student.lastName}`.toLowerCase();
    const studentEmail = e.student.email.toLowerCase();
    const className = e.class.name.toLowerCase();
    const search = searchTerm.toLowerCase();

    return studentName.includes(search) || studentEmail.includes(search) || className.includes(search);
  });

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Enrollments</h1>
            <p className="text-gray-500 text-sm">Manage student access and payments.</p>
          </div>
          
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
             {['all', 'paid', 'unpaid'].map(status => (
                 <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                        filterStatus === status 
                        ? "bg-white text-[#0b2540] shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                 >
                    {status}
                 </button>
             ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search by student name, email or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540] outline-none"
            />
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
                <div className="p-10 text-center text-gray-400">Loading enrollments...</div>
            ) : filteredList.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No enrollments found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Enrolled Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredList.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {item.student.firstName} {item.student.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">{item.student.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-700 font-medium">{item.class.name}</div>
                                        <div className="text-xs text-gray-400">LKR {item.class.price.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.paymentStatus === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckBadgeIcon className="w-3 h-3" /> Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                <ClockIcon className="w-3 h-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {moment(item.createdAt).format("MMM DD, YYYY")}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        {item.paymentStatus !== 'paid' && (
                                            <button 
                                                onClick={() => handleMarkPaid(item._id)}
                                                className="text-xs bg-[#0b2540] text-white px-3 py-1.5 rounded-lg hover:bg-[#153454]"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(item._id)}
                                            className="text-xs border border-gray-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
                                        >
                                            Remove
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
    </DashboardLayout>
  );
}