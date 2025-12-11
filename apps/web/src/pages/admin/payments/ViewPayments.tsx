import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  FileText, 
  Download 
} from 'lucide-react';

// --- Types ---
interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  courseTitle: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  slipUrl: string; // URL to the uploaded receipt image
}

// --- Mock Data (Replace with API Call) ---
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-001',
    studentName: 'Kasun Perera',
    studentId: 'ST-2024-005',
    courseTitle: 'Advanced Financial Accounting',
    amount: 5000,
    date: '2025-12-10',
    status: 'pending',
    slipUrl: 'https://via.placeholder.com/400x600?text=Bank+Slip+1'
  },
  {
    id: 'PAY-002',
    studentName: 'Amara Silva',
    studentId: 'ST-2024-012',
    courseTitle: 'Corporate Taxation',
    amount: 4500,
    date: '2025-12-09',
    status: 'approved',
    slipUrl: 'https://via.placeholder.com/400x600?text=Bank+Slip+2'
  },
  {
    id: 'PAY-003',
    studentName: 'Nimali Fernando',
    studentId: 'ST-2024-008',
    courseTitle: 'Audit & Assurance',
    amount: 5000,
    date: '2025-12-08',
    status: 'rejected',
    slipUrl: 'https://via.placeholder.com/400x600?text=Bank+Slip+3'
  },
];

const ViewPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // --- Handlers ---
  const handleStatusChange = (id: string, newStatus: Payment['status']) => {
    // In a real app, make an API call here (e.g., axios.patch)
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesSearch = 
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // --- Render Helpers ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-500 text-sm mt-1">Review and verify student bank transfers and payments.</p>
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[150px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount (LKR)</th>
                  <th className="px-6 py-4">Slip</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{payment.studentName}</span>
                          <span className="text-xs text-gray-400">{payment.studentId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={payment.courseTitle}>
                        {payment.courseTitle}
                      </td>
                      <td className="px-6 py-4">{payment.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        Rs. {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedSlip(payment.slipUrl)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <FileText className="w-3 h-3" /> View Slip
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(payment.id, 'approved')}
                                className="p-1.5 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(payment.id, 'rejected')}
                                className="p-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {payment.status !== 'pending' && (
                            <span className="text-gray-400 text-xs italic">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No payments found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Slip Viewer Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Payment Slip Verification</h3>
              <button 
                onClick={() => setSelectedSlip(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 bg-gray-100 flex-1 overflow-auto flex items-center justify-center">
              <img 
                src={selectedSlip} 
                alt="Payment Slip" 
                className="max-w-full h-auto rounded shadow-sm"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPayments;