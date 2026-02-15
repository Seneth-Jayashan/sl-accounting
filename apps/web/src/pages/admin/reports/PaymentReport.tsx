import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import PaymentService, { type PaymentReportResponse, type PaymentData, type ReportParams } from "../../../services/PaymentService";

// ... (Keep constants: TEACHER_DETAILS, LOGO_PATH, AVATAR_COLORS, Helpers) ...

const TEACHER_DETAILS = {
  name: "A W Kalum Madusanka",
  address: "Kurusagoda, Gonapinuwala",
  phone1: "076 8826142",
  phone2: "071 6832911",
};

const LOGO_PATH = "/logo.png"; 

// ... (Keep helper functions: loadImage, getAvatarColor) ...
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  const AVATAR_COLORS = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-emerald-100 text-emerald-600",
    "bg-pink-100 text-pink-600",
    "bg-orange-100 text-orange-600"
  ];
  
  const getAvatarColor = (name: string): string => {
    if (!name) return AVATAR_COLORS[0];
    return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  };

export default function PaymentReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<PaymentReportResponse | null>(null);
  
  // 1. CHANGE DEFAULT TO 'all_time'
  const [filterType, setFilterType] = useState<ReportParams["filterType"] | "all_time">("all_time");
  
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // 2. Wrap generate in useCallback to use in useEffect
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      // @ts-ignore - allowing 'all_time' string even if not in original interface strict type
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

  // 3. AUTO-FETCH ON MOUNT
  useEffect(() => {
    handleGenerate();
  }, []); // Empty dependency array = runs once on mount (and since default is 'all_time', it fetches all)

  const downloadPDF = async () => {
    // ... (Keep PDF Logic exactly as before) ...
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
        // Handle "All Time" display text in PDF
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
              fillColor: [41, 128, 185], 
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
        for(let i = 1; i <= pageCount; i++) {
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
    <div className="space-y-6 font-sans pb-24 md:pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-prussian">Financial Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Generate income reports and export to PDF</p>
        </div>
        {reportData && (
          <button
            onClick={downloadPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 text-sm font-semibold"
          >
            <ArrowDownTrayIcon className="w-5 h-5" /> <span>Download PDF</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-3 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-brand-aliceBlue">
        
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 md:max-w-xs">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              className="w-full pl-10 pr-8 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 appearance-none cursor-pointer text-sm font-medium text-gray-700 border-none"
              value={filterType}
              // @ts-ignore
              onChange={(e) => setFilterType(e.target.value)}
            >
              {/* Added 'All Time' Option */}
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
            <div className="flex gap-2 flex-1 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Date Inputs... */}
               <div className="relative flex-1">
                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-3 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 text-sm font-medium text-gray-600"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-3 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 text-sm font-medium text-gray-600"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-md shadow-brand-cerulean/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        >
          {loading ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <BanknotesIcon className="w-5 h-5" />
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>

      {/* Content Area */}
      {/* 4. Show Loading State explicitly or data */}
      {loading && !reportData && (
         <div className="flex flex-col items-center justify-center py-20 text-brand-cerulean/50">
            <ArrowPathIcon className="w-10 h-10 animate-spin mb-2" />
            <p className="text-sm font-medium">Loading payments...</p>
         </div>
      )}

      {reportData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Summary Cards and Table (Same as before) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-brand-aliceBlue shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-brand-prussian">
                    {PaymentService.formatCurrency(reportData.totalAmount)}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CurrencyDollarIcon className="w-3 h-3" /> Income Generated
                  </p>
               </div>
               <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                  <BanknotesIcon className="w-6 h-6 text-emerald-600" />
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-brand-aliceBlue shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Transactions</p>
                  <h3 className="text-2xl font-bold text-brand-prussian">
                    {reportData.count}
                  </h3>
                  <p className="text-xs text-brand-cerulean font-medium mt-1 flex items-center gap-1">
                    <DocumentTextIcon className="w-3 h-3" /> Payments Processed
                  </p>
               </div>
               <div className="w-12 h-12 bg-brand-aliceBlue/50 rounded-full flex items-center justify-center">
                  <CreditCardIcon className="w-6 h-6 text-brand-prussian" />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-aliceBlue shadow-sm overflow-hidden flex flex-col">
            {reportData.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-400 py-16">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <BanknotesIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-semibold">No transactions found</h3>
                  <p className="text-sm">Try changing the date range</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-brand-aliceBlue/40 text-[10px] uppercase text-gray-500 font-bold tracking-widest border-b border-brand-aliceBlue">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Class Details</th>
                          <th className="px-6 py-4">Method</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-aliceBlue">
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
    // ... (Keep existing PaymentRow implementation) ...
    const displayName = payment.enrollment?.student 
    ? `${payment.enrollment.student.firstName} ${payment.enrollment.student.lastName}` 
    : "Unknown Student";
    
  const email = payment.enrollment?.student?.email || "No Email";
  const className = payment.enrollment?.class?.name || "Unknown Class";
  const targetMonth = payment.targetMonth || "N/A";

  const methodConfig = {
    payhere: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", label: "Online" },
    manual: { bg: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-400", label: "Cash" },
    bank_transfer: { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", label: "Bank Slip" }
  };
  const config = methodConfig[payment.method] || methodConfig.manual;

  return (
    <tr className="transition-colors hover:bg-brand-aliceBlue/20 group">
      <td className="px-6 py-4 text-sm text-gray-600">
         <div className="font-medium text-brand-prussian">
            {new Date(payment.paymentDate).toLocaleDateString()}
         </div>
         <div className="text-xs text-gray-400">
            {new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(displayName)}`}>
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-brand-prussian text-sm">{displayName}</div>
            <div className="text-xs text-gray-500">{email}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
         <div className="text-sm font-medium text-gray-700">{className}</div>
         <span className="inline-block mt-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wide">
             {targetMonth}
         </span>
      </td>

      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${config.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`}></span>
          {config.label}
        </span>
      </td>

      <td className="px-6 py-4 text-right">
         <span className="font-bold text-brand-prussian tabular-nums">
            {PaymentService.formatCurrency(payment.amount)}
         </span>
      </td>
    </tr>
  );
};