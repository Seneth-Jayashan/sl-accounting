import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import PaymentService, { type PaymentReportResponse, type PaymentData, type ReportParams } from "../../../services/PaymentService";

// --- Constants ---
const TEACHER_DETAILS = {
  name: "A W Kalum Madusanka",
  address: "Kurusagoda, Gonapinuwala",
  phone1: "076 8826142",
  phone2: "071 6832911",
};

const LOGO_PATH = "/logo.png";

// --- Helpers ---
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700"
];

const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
};

export default function PaymentReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<PaymentReportResponse | null>(null);

  const [filterType, setFilterType] = useState<ReportParams["filterType"] | "all_time">("all_time");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const params: ReportParams = { filterType };

      if (filterType === "custom" && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const data = await PaymentService.getPaymentReport(params);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, customStart, customEnd]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const downloadPDF = async () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      const logoImg = await loadImage(LOGO_PATH);
      const logoWidth = 30;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

      // --- Header ---
      doc.addImage(logoImg, 'PNG', 14, 10, logoWidth, logoHeight);

      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT INCOME REPORT", 14, 15 + logoHeight + 10);

      const boxWidth = 80;
      const boxHeight = 35;
      const boxX = pageWidth - 14 - boxWidth;
      const boxY = 10;

      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(41, 128, 185);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, "FD");

      doc.setTextColor(0, 0, 0);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(TEACHER_DETAILS.name, boxX + 5, boxY + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(TEACHER_DETAILS.address, boxX + 5, boxY + 14);

      doc.text(`Mobile: ${TEACHER_DETAILS.phone1}`, boxX + 5, boxY + 22);
      doc.text(`        ${TEACHER_DETAILS.phone2}`, boxX + 5, boxY + 27);

      doc.setDrawColor(200);
      doc.line(14, 60, pageWidth - 14, 60);

      // --- Summary ---
      const startDate = new Date(reportData.period.start).toLocaleDateString();
      const endDate = new Date(reportData.period.end).toLocaleDateString();

      doc.setFontSize(10);
      doc.setTextColor(100);
      const periodText = filterType === 'all_time' ? "All Time History" : `Period: ${startDate} to ${endDate}`;
      doc.text(periodText, 14, 70);

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 75, pageWidth - 28, 15, "F");

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Transactions: ${reportData.count}`, 20, 85);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(39, 174, 96);
      doc.text(
        `Total Revenue: LKR ${reportData.totalAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`,
        pageWidth - 20,
        85,
        { align: "right" }
      );

      // --- Table ---
      const tableColumn = ["#", "Date", "Student Name", "Class", "Month", "Method", "Amount (LKR)"];
      const tableRows: any[] = [];

      reportData.data.forEach((payment, index) => {
        const paymentDate = new Date(payment.paymentDate).toLocaleDateString();
        const studentName = `${payment.enrollment?.student?.firstName || 'N/A'} ${payment.enrollment?.student?.lastName || ''}`;
        const className = payment.enrollment?.class?.name || 'N/A';
        const month = payment.targetMonth || '-';
        const method = payment.method === 'bank_transfer' ? 'Bank Slip' : payment.method === 'payhere' ? 'Online' : 'Cash';
        const amount = payment.amount.toLocaleString("en-LK", { minimumFractionDigits: 2 });

        tableRows.push([index + 1, paymentDate, studentName, className, month, method, amount]);
      });

      autoTable(doc, {
        startY: 100,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [13, 75, 91],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'right', fontStyle: 'bold' }
        },
        foot: [['', '', '', '', '', 'TOTAL', reportData.totalAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 })]],
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'right' }
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const now = new Date().toLocaleString();
        doc.text(`Generated on ${now} | System by One X Universe (Pvt) Ltd`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: "right" });
      }

      doc.save(`Payment_Report.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF.");
    }
  };

  return (
    <div className="w-full space-y-5 pb-10">

      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Generate income reports and export to PDF</p>
        </div>
        {reportData && (
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-[#0d4b5b] hover:bg-[#093946] text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-xs font-bold shrink-0"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5 stroke-[2]" /> Download PDF
          </button>
        )}
      </div>

      {/* --- Filter Bar --- */}
      <div className="flex flex-col md:flex-row gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:max-w-[200px] relative">
          <FunnelIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2" />
          <select
            className="w-full pl-7 py-1 bg-transparent outline-none cursor-pointer text-xs font-medium text-gray-500 appearance-none"
            value={filterType}
            // @ts-ignore
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all_time">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {filterType === "custom" && (
          <div className="flex gap-2 flex-1 items-center animate-in fade-in slide-in-from-left-4 duration-300 w-full">
            <div className="relative flex-1 max-w-[150px]">
              <CalendarDaysIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                className="w-full pl-8 pr-2 py-1.5 bg-gray-50 rounded-lg outline-none text-[11px] font-medium text-gray-600 border border-gray-100"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <span className="text-gray-400 text-[10px]">-</span>
            <div className="relative flex-1 max-w-[150px]">
              <CalendarDaysIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                className="w-full pl-8 pr-2 py-1.5 bg-gray-50 rounded-lg outline-none text-[11px] font-medium text-gray-600 border border-gray-100"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-gray-400 shrink-0"
          title="Refresh Data"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* --- Content Area --- */}
      {loading && !reportData && (
        <div className="flex flex-col items-center justify-center py-16 text-[#0d4b5b]/50">
          <ArrowPathIcon className="w-6 h-6 animate-spin mb-2" />
          <p className="text-xs font-bold">Loading reports...</p>
        </div>
      )}

      {reportData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">

          {/* --- Summary Cards --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  LKR {reportData.totalAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] font-bold text-[#0d4b5b] mt-1">Income Generated</p>
              </div>
              <BanknotesIcon className="w-9 h-9 text-[#0d4b5b] stroke-[1.2]" />
            </div>

            {/* Transactions Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">Transactions</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {reportData.count}
                </h3>
                <p className="text-[10px] font-bold text-[#0d4b5b] mt-1">Payments Processed</p>
              </div>
              <CurrencyDollarIcon className="w-9 h-9 text-[#0d4b5b] stroke-[1.2]" />
            </div>
          </div>

          {/* --- Table --- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
            {reportData.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                  <BanknotesIcon className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-gray-900 text-sm font-bold">No transactions found</h3>
                <p className="text-[10px] mt-1">Try changing the date range filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full scrollbar-hide">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] uppercase text-gray-400 font-bold tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Student</th>
                      <th className="px-4 py-3 font-bold">Class Details</th>
                      <th className="px-4 py-3 font-bold">Method</th>
                      <th className="px-4 py-3 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.data.map((payment) => (
                      <PaymentRow key={payment._id} payment={payment} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PaymentRow = ({ payment }: { payment: PaymentData }) => {
  const displayName = payment.enrollment?.student
    ? `${payment.enrollment.student.firstName} ${payment.enrollment.student.lastName}`
    : "Unknown Student";

  const email = payment.enrollment?.student?.email || "No Email";
  const className = payment.enrollment?.class?.name || "Unknown Class";
  const targetMonth = payment.targetMonth || "N/A";

  const methodConfig: Record<string, string> = {
    payhere: "Online",
    manual: "Cash",
    bank_transfer: "Bank Slip"
  };
  const label = methodConfig[payment.method] || "Cash";

  return (
    <tr className="transition-colors hover:bg-gray-50/50 group">

      {/* Date */}
      <td className="px-4 py-3 align-middle">
        <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
          {new Date(payment.paymentDate).toLocaleDateString('en-US')}
        </div>
        <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
          {new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>

      {/* Student */}
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(displayName)}`}>
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-xs truncate">{displayName}</div>
            <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{email}</div>
          </div>
        </div>
      </td>

      {/* Class Details */}
      <td className="px-4 py-3 align-middle">
        <div className="text-xs font-medium text-gray-700 leading-tight mb-1 truncate max-w-[180px]">{className}</div>
        <span className="inline-block text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded tracking-wide whitespace-nowrap">
          {targetMonth}
        </span>
      </td>

      {/* Method */}
      <td className="px-4 py-3 align-middle">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 bg-gray-100 whitespace-nowrap">
          {label}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right align-middle">
        <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
          LKR {payment.amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
        </span>
      </td>
    </tr>
  );
};