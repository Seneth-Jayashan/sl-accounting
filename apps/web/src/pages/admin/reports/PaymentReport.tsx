import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CreditCardIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import PaymentService, {
  type PaymentReportResponse,
  type PaymentData,
  type ReportParams,
} from "../../../services/PaymentService";

// --- Constants & Helpers ---

const TEACHER_DETAILS = {
  name: "A W Kalum Madusanka",
  address: "Kurusagoda, Gonapinuwala",
  phone1: "076 8826142",
  phone2: "071 6832911",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 ring-blue-200",
  "bg-purple-100 text-purple-700 ring-purple-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-pink-100 text-pink-700 ring-pink-200",
  "bg-amber-100 text-amber-700 ring-amber-200",
];

const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
};

type ExtendedFilterType = ReportParams["filterType"] | "all_time";

const FILTER_OPTIONS: { value: ExtendedFilterType; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

// --- Skeleton Loader ---

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-36 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-64 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function PaymentReport() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<PaymentReportResponse | null>(null);

  const [filterType, setFilterType] = useState<ExtendedFilterType>("all_time");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Client-side table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const handleGenerate = useCallback(
    async (overrideType?: ExtendedFilterType) => {
      const activeType = overrideType ?? filterType;
      if (activeType === "custom" && (!customStart || !customEnd)) return;

      setLoading(true);
      try {
        // @ts-ignore - allowing 'all_time' string even if not in original interface strict type
        const params: ReportParams = { filterType: activeType };

        if (activeType === "custom" && customStart && customEnd) {
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
    },
    [filterType, customStart, customEnd]
  );

  useEffect(() => {
    handleGenerate("all_time");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFilter = (type: ExtendedFilterType) => {
    setFilterType(type);
    if (type !== "custom") {
      handleGenerate(type);
    }
  };

  // Filtered rows for instant search & method filtering
  const filteredPayments = useMemo(() => {
    if (!reportData?.data) return [];
    return reportData.data.filter((payment) => {
      const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
      if (!matchesMethod) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const studentName = `${payment.enrollment?.student?.firstName || ""} ${payment.enrollment?.student?.lastName || ""
        }`.toLowerCase();
      const email = (payment.enrollment?.student?.email || "").toLowerCase();
      const className = (payment.enrollment?.class?.name || "").toLowerCase();
      const month = (payment.targetMonth || "").toLowerCase();

      return (
        studentName.includes(q) ||
        email.includes(q) ||
        className.includes(q) ||
        month.includes(q)
      );
    });
  }, [reportData, searchQuery, methodFilter]);

  const averageAmount = useMemo(() => {
    if (!reportData || reportData.count === 0) return 0;
    return reportData.totalAmount / reportData.count;
  }, [reportData]);

  const downloadWord = async () => {
    if (!reportData) return;
    setExporting(true);

    try {
      const startDate = new Date(reportData.period.start).toLocaleDateString();
      const endDate = new Date(reportData.period.end).toLocaleDateString();
      const periodText =
        filterType === "all_time"
          ? "All Time History"
          : `Period: ${startDate} to ${endDate}`;

      const tableRows = [
        new TableRow({
          children: [
            "#",
            "Date",
            "Student Name",
            "Class",
            "Month",
            "Method",
            "Amount (LKR)",
          ].map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true })],
                  }),
                ],
              })
          ),
          tableHeader: true,
        }),
      ];

      reportData.data.forEach((payment, index) => {
        const paymentDate = new Date(payment.paymentDate).toLocaleDateString();
        const studentName = `${payment.enrollment?.student?.firstName || "N/A"} ${payment.enrollment?.student?.lastName || ""
          }`;
        const className = payment.enrollment?.class?.name || "N/A";
        const month = payment.targetMonth || "-";
        const method =
          payment.method === "bank_transfer"
            ? "Bank Slip"
            : payment.method === "payhere"
              ? "Online"
              : "Cash";
        const amount = payment.amount.toLocaleString("en-LK", {
          minimumFractionDigits: 2,
        });

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph((index + 1).toString())] }),
              new TableCell({ children: [new Paragraph(paymentDate)] }),
              new TableCell({ children: [new Paragraph(studentName)] }),
              new TableCell({ children: [new Paragraph(className)] }),
              new TableCell({ children: [new Paragraph(month)] }),
              new TableCell({ children: [new Paragraph(method)] }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: amount })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          })
        );
      });

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "TOTAL", bold: true })],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: reportData.totalAmount.toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                      }),
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          ],
        })
      );

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "PAYMENT INCOME REPORT",
                    bold: true,
                    size: 32,
                    color: "2980B9",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: TEACHER_DETAILS.name, bold: true, size: 24 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: TEACHER_DETAILS.address })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Mobile: ${TEACHER_DETAILS.phone1} / ${TEACHER_DETAILS.phone2}`,
                  }),
                ],
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [new TextRun({ text: periodText, color: "888888" })],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Total Transactions: ${reportData.count}` }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total Revenue: LKR ${reportData.totalAmount.toLocaleString(
                      "en-LK",
                      { minimumFractionDigits: 2 }
                    )}`,
                    bold: true,
                    color: "27AE60",
                  }),
                ],
                spacing: { after: 400 },
              }),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `\nGenerated on ${new Date().toLocaleString()} | System by One X Universe (Pvt) Ltd`,
                    size: 16,
                    color: "888888",
                  }),
                ],
                spacing: { before: 400 },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Payment_Report_${filterType}.docx`);
    } catch (err) {
      console.error("Word Generation Error:", err);
      alert("Failed to generate Word Document.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Financial Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track tuition income, filter transactions, and export Word reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            title="Refresh data"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          {reportData && (
            <button
              onClick={downloadWord}
              disabled={exporting || reportData.data.length === 0}
              className="inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4" />
              )}
              <span>{exporting ? "Exporting..." : "Export Word"}</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER PILLS & CUSTOM DATE RANGE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => {
            const active = filterType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectFilter(opt.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active
                    ? "bg-brand-prussian text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {filterType === "custom" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100">
            <div className="relative flex-1">
              <CalendarDaysIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                aria-label="Start Date"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean text-sm text-slate-700"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <span className="text-xs font-semibold text-slate-400 text-center">to</span>
            <div className="relative flex-1">
              <CalendarDaysIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                aria-label="End Date"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean text-sm text-slate-700"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleGenerate("custom")}
              disabled={loading || !customStart || !customEnd}
              className="px-5 py-2.5 bg-brand-cerulean hover:bg-brand-prussian text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Apply Range
            </button>
          </div>
        )}
      </div>

      {/* LOADING SKELETON */}
      {loading && !reportData && <ReportSkeleton />}

      {/* REPORT CONTENT */}
      {reportData && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Revenue
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {PaymentService.formatCurrency(reportData.totalAmount)}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    Gross income collected
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <BanknotesIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Transactions
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {reportData.count.toLocaleString()}
                  </h3>
                  <p className="text-xs text-brand-cerulean font-medium mt-2 flex items-center gap-1">
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    Verified payments
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg. Payment
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {PaymentService.formatCurrency(averageAmount)}
                  </h3>
                  <p className="text-xs text-purple-600 font-medium mt-2">
                    Per transaction
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                  <ChartBarIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* TRANSACTIONS TABLE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, class, or month..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(["all", "payhere", "bank_transfer", "manual"] as const).map((m) => {
                  const labels: Record<string, string> = {
                    all: "All Methods",
                    payhere: "Online",
                    bank_transfer: "Bank Slip",
                    manual: "Cash",
                  };
                  const active = methodFilter === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMethodFilter(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active
                          ? "bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20"
                          : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Content */}
            {filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <BanknotesIcon className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  No matching transactions
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your date range, search query, or payment method filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Class & Month</th>
                      <th className="px-6 py-3.5">Method</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((payment) => (
                      <PaymentRow key={payment._id} payment={payment} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Summary */}
            {filteredPayments.length > 0 && (
              <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing <strong className="text-brand-prussian">{filteredPayments.length}</strong> of{" "}
                  <strong className="text-brand-prussian">{reportData.data.length}</strong> transactions
                </span>
                <span className="font-semibold text-brand-prussian tabular-nums">
                  Filtered Total:{" "}
                  {PaymentService.formatCurrency(
                    filteredPayments.reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Table Row Component ---

const PaymentRow = ({ payment }: { payment: PaymentData }) => {
  const displayName = payment.enrollment?.student
    ? `${payment.enrollment.student.firstName} ${payment.enrollment.student.lastName}`
    : "Unknown Student";

  const email = payment.enrollment?.student?.email || "No Email";
  const className = payment.enrollment?.class?.name || "Unknown Class";
  const targetMonth = payment.targetMonth || "N/A";

  const methodConfig = {
    payhere: {
      bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
      dot: "bg-emerald-500",
      label: "Online",
    },
    manual: {
      bg: "bg-amber-50 text-amber-700 ring-amber-600/15",
      dot: "bg-amber-500",
      label: "Cash",
    },
    bank_transfer: {
      bg: "bg-blue-50 text-blue-700 ring-blue-600/15",
      dot: "bg-blue-500",
      label: "Bank Slip",
    },
  };
  const config = methodConfig[payment.method] || methodConfig.manual;

  return (
    <tr className="transition-colors hover:bg-slate-50/80">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-brand-prussian">
          {new Date(payment.paymentDate).toLocaleDateString()}
        </div>
        <div className="text-xs text-slate-400">
          {new Date(payment.paymentDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
              displayName
            )}`}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-brand-prussian text-sm truncate">
              {displayName}
            </div>
            <div className="text-xs text-slate-400 truncate">{email}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-700">{className}</div>
        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
          {targetMonth}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${config.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
          {config.label}
        </span>
      </td>

      <td className="px-6 py-4 text-right whitespace-nowrap">
        <span className="text-sm font-bold text-brand-prussian tabular-nums">
          {PaymentService.formatCurrency(payment.amount)}
        </span>
      </td>
    </tr>
  );
};