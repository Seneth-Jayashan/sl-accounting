import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import PaymentService, {
  type PaymentData,
} from "../../../services/PaymentService";

import {
  BanknotesIcon,
  CreditCardIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  PlusIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { ListVideoIcon } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Helper to format billing month
const formatBillingMonth = (monthStr?: string) => {
  if (!monthStr) return "N/A";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

// --- Skeleton Loader ---

function PaymentsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-2xl border border-slate-100 p-6"
          >
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-72 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function PaymentsPage() {
  const navigate = useNavigate();

  // Data State
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Slip Preview Modal State
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // Verify Confirmation Modal State
  const [verifyDialog, setVerifyDialog] = useState<{
    payment: PaymentData;
    action: "approve" | "reject";
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PaymentService.getAllPayments(filterStatus);
      setPayments(data || []);
    } catch (error) {
      console.error("Payment sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Derived KPI Stats (from currently loaded dataset)
  const stats = useMemo(() => {
    let collectedRevenue = 0;
    let settled = 0;
    let pending = 0;
    let failed = 0;

    payments.forEach((p) => {
      if (p.status === "completed") {
        settled++;
        collectedRevenue += Number(p.amount || 0);
      } else if (p.status === "pending") {
        pending++;
      } else {
        failed++;
      }
    });

    return { collectedRevenue, settled, pending, failed };
  }, [payments]);

  const handleConfirmVerify = async () => {
    if (!verifyDialog) return;
    const { payment, action } = verifyDialog;
    const original = [...payments];
    const newStatus = action === "approve" ? "completed" : "failed";

    setIsVerifying(true);
    setPayments((prev) =>
      prev.map((p) => (p._id === payment._id ? { ...p, status: newStatus } : p))
    );

    try {
      await PaymentService.verifyPayment(payment._id, action);
      setVerifyDialog(null);
      fetchPayments();
    } catch {
      setPayments(original);
      alert("Verification failed. Please check server logs.");
    } finally {
      setIsVerifying(false);
    }
  };

  const getSlipUrl = (path?: string) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return path.startsWith("http") ? path : `${API_BASE}/${cleanPath}`;
  };

  // Frontend Search Filter
  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return payments;

    return payments.filter((payment) => {
      const firstName =
        payment.enrollment?.student?.firstName?.toLowerCase() || "";
      const lastName =
        payment.enrollment?.student?.lastName?.toLowerCase() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      const className =
        payment.enrollment?.class?.name?.toLowerCase() || "";
      const packName =
        payment.enrollment?.lessonPack?.title?.toLowerCase() || "";
      const notes = payment.notes?.toLowerCase() || "";
      const amount = payment.amount?.toString() || "";

      return (
        fullName.includes(query) ||
        className.includes(query) ||
        packName.includes(query) ||
        notes.includes(query) ||
        amount.includes(query)
      );
    });
  }, [payments, searchQuery]);

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Revenue Operations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Verify bank transfers, track PayHere settlements, and record manual payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchPayments}
            disabled={loading}
            title="Refresh ledger"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
                }`}
            />
          </button>

          <button
            onClick={() => navigate("/admin/payments/create")}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Record Payment</span>
          </button>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && payments.length === 0 ? (
        <PaymentsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Collected Revenue
                  </p>
                  <h3 className="text-2xl font-bold text-brand-prussian mt-2 tabular-nums truncate">
                    LKR {stats.collectedRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 shrink-0">
                  <CurrencyDollarIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Settled
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.settled}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pending Review
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.pending}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Flagged / Failed
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.failed}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                  <XCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* LEDGER DIRECTORY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search student, class, lesson pack, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
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

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 overflow-x-auto self-start lg:self-auto">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "completed", label: "Completed" },
                    { key: "failed", label: "Failed" },
                  ] as const
                ).map((tab) => {
                  const active = filterStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilterStatus(tab.key)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${active
                          ? "bg-white text-brand-prussian shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            {filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <BanknotesIcon className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  {searchQuery
                    ? "No matching transactions"
                    : "No payment records found"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {searchQuery
                    ? "Try adjusting your search query or status filter."
                    : "Transactions will appear here once students submit payments or you record one manually."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Student & Module</th>
                        <th className="px-6 py-3.5">Billing Period</th>
                        <th className="px-6 py-3.5">Method</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence mode="popLayout">
                        {filteredPayments.map((payment) => (
                          <PaymentRow
                            key={payment._id}
                            payment={payment}
                            onViewSlip={(url) => setSelectedSlip(url)}
                            onRequestVerify={(action) =>
                              setVerifyDialog({ payment, action })
                            }
                            getSlipUrl={getSlipUrl}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredPayments.map((payment) => (
                      <MobilePaymentCard
                        key={payment._id}
                        payment={payment}
                        onViewSlip={(url) => setSelectedSlip(url)}
                        onRequestVerify={(action) =>
                          setVerifyDialog({ payment, action })
                        }
                        getSlipUrl={getSlipUrl}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- VERIFICATION CONFIRMATION MODAL --- */}
      {verifyDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${verifyDialog.action === "approve"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                  }`}
              >
                {verifyDialog.action === "approve" ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian capitalize">
                  {verifyDialog.action} payment?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  You are about to{" "}
                  <strong className="text-brand-prussian">
                    {verifyDialog.action}
                  </strong>{" "}
                  a payment of{" "}
                  <strong className="text-brand-prussian tabular-nums">
                    LKR {Number(verifyDialog.payment.amount || 0).toLocaleString()}
                  </strong>{" "}
                  from{" "}
                  <strong className="text-brand-prussian">
                    {verifyDialog.payment.enrollment?.student?.firstName}{" "}
                    {verifyDialog.payment.enrollment?.student?.lastName}
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setVerifyDialog(null)}
                disabled={isVerifying}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerify}
                disabled={isVerifying}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${verifyDialog.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                  }`}
              >
                {isVerifying && (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {isVerifying
                    ? "Processing..."
                    : verifyDialog.action === "approve"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SLIP IMAGE VIEWER MODAL --- */}
      <AnimatePresence>
        {selectedSlip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4"
            onClick={() => setSelectedSlip(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200/70 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-brand-prussian">
                    Payment Verification Slip
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspect bank transfer receipt before approving.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-slate-50 flex justify-center items-center overflow-auto flex-1">
                <img
                  src={selectedSlip}
                  alt="Payment Slip"
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200/80"
                />
              </div>

              <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Close
                </button>
                <a
                  href={selectedSlip}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors"
                >
                  <span>Open Original</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

interface PaymentItemProps {
  payment: PaymentData;
  onViewSlip: (url: string) => void;
  onRequestVerify: (action: "approve" | "reject") => void;
  getSlipUrl: (path?: string) => string | null;
}

function PaymentRow({
  payment,
  onViewSlip,
  onRequestVerify,
  getSlipUrl,
}: PaymentItemProps) {
  const slipUrl =
    payment.method === "bank_transfer"
      ? getSlipUrl(payment.rawPayload?.slipUrl)
      : null;
  const studentName = `${payment.enrollment?.student?.firstName || ""} ${payment.enrollment?.student?.lastName || ""
    }`.trim();
  const moduleName =
    payment.enrollment?.class?.name ||
    payment.enrollment?.lessonPack?.title ||
    "N/A";

  return (
    <motion.tr
      layout
      className="hover:bg-slate-50/80 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="text-sm font-semibold text-brand-prussian">
          {studentName || "Unknown Student"}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
          {moduleName}
        </div>
        <div className="text-xs font-bold text-emerald-700 mt-1 tabular-nums">
          LKR {Number(payment.amount || 0).toLocaleString()}
        </div>

        {payment.notes && (
          <div
            className="mt-2 flex items-start gap-1.5 bg-slate-50 border border-slate-200/70 px-2.5 py-1.5 rounded-lg max-w-xs"
            title={payment.notes}
          >
            <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">
              {payment.notes}
            </span>
          </div>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 text-xs font-semibold text-brand-prussian">
          {payment.enrollment?.lessonPack ? (
            <>
              <ListVideoIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lesson Pack</span>
            </>
          ) : (
            <>
              <CalendarDaysIcon className="w-3.5 h-3.5 text-brand-cerulean" />
              <span>{formatBillingMonth(payment.targetMonth)}</span>
            </>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 capitalize">
          {payment.method === "payhere" ? (
            <CreditCardIcon className="w-4 h-4 text-brand-cerulean" />
          ) : (
            <BanknotesIcon className="w-4 h-4 text-indigo-500" />
          )}
          <span>{payment.method?.replace("_", " ")}</span>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-xs font-semibold text-brand-prussian tabular-nums">
          {moment(payment.paymentDate).format("DD MMM YYYY")}
        </div>
        <div className="text-[11px] text-slate-400 tabular-nums">
          {moment(payment.paymentDate).format("hh:mm A")}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={payment.status} />
          {slipUrl && (
            <button
              onClick={() => onViewSlip(slipUrl)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors"
            >
              <DocumentMagnifyingGlassIcon className="w-3.5 h-3.5" />
              Review Slip
            </button>
          )}
        </div>
      </td>

      <td className="px-6 py-4 text-right whitespace-nowrap">
        {payment.status === "pending" ? (
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              onClick={() => onRequestVerify("approve")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              title="Approve payment"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={() => onRequestVerify("reject")}
              className="p-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Reject payment"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Locked
          </span>
        )}
      </td>
    </motion.tr>
  );
}

function MobilePaymentCard({
  payment,
  onViewSlip,
  onRequestVerify,
  getSlipUrl,
}: PaymentItemProps) {
  const slipUrl =
    payment.method === "bank_transfer"
      ? getSlipUrl(payment.rawPayload?.slipUrl)
      : null;
  const moduleName =
    payment.enrollment?.class?.name ||
    payment.enrollment?.lessonPack?.title ||
    "N/A";

  return (
    <motion.div layout className="p-4 bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-brand-prussian truncate">
            {payment.enrollment?.student?.firstName}{" "}
            {payment.enrollment?.student?.lastName}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{moduleName}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
        <span className="font-bold text-emerald-700 tabular-nums">
          LKR {Number(payment.amount || 0).toLocaleString()}
        </span>
        <span className="font-semibold text-brand-prussian">
          {payment.enrollment?.lessonPack
            ? "Lesson Pack"
            : formatBillingMonth(payment.targetMonth)}
        </span>
      </div>

      {payment.notes && (
        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 flex items-start gap-2">
          <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            {payment.notes}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500 capitalize">
          {payment.method === "payhere" ? (
            <CreditCardIcon className="w-4 h-4 text-brand-cerulean" />
          ) : (
            <BanknotesIcon className="w-4 h-4 text-indigo-500" />
          )}
          <span>{payment.method?.replace("_", " ")}</span>
        </div>

        {slipUrl && (
          <button
            onClick={() => onViewSlip(slipUrl)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-cerulean"
          >
            <DocumentMagnifyingGlassIcon className="w-4 h-4" />
            Review Slip
          </button>
        )}
      </div>

      {payment.status === "pending" && (
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={() => onRequestVerify("approve")}
            className="py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
          >
            <CheckCircleIcon className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => onRequestVerify("reject")}
            className="py-2 bg-rose-50 text-rose-600 border border-rose-200/70 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
          >
            <XCircleIcon className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    completed: {
      color: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
      icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
      label: "Settled",
    },
    pending: {
      color: "bg-amber-50 text-amber-700 ring-amber-600/15",
      icon: <ClockIcon className="w-3.5 h-3.5" />,
      label: "Pending",
    },
    failed: {
      color: "bg-rose-50 text-rose-700 ring-rose-600/15",
      icon: <XCircleIcon className="w-3.5 h-3.5" />,
      label: "Flagged",
    },
  };

  const current = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${current.color}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
}