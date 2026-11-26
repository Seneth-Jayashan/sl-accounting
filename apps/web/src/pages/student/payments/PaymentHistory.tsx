import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  Eye,
  FileText,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Calendar,
  ExternalLink,
  Search,
  Receipt,
  Printer,
  ShieldCheck,
} from "lucide-react";

import PaymentService, {
  type PaymentData,
} from "../../../services/PaymentService";

// --- CONFIG ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getImageUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanPath}`;
};

type PaymentFilter = "all" | "completed" | "pending" | "failed";

export default function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [viewSlip, setViewSlip] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<PaymentData | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await PaymentService.getMyPayments();
        if (isMounted) setPayments(data || []);
      } catch (error) {
        console.error("Failed to load payments", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    if (!viewSlip && !viewReceipt) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewSlip(null);
        setViewReceipt(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewSlip, viewReceipt]);

  // --- STATS & FILTERING ---
  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");
    const failed = payments.filter(
      (p) => p.status !== "completed" && p.status !== "pending"
    );
    const totalPaid = completed.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    return {
      all: payments.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalPaid,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments.filter((p) => {
      if (filter === "completed" && p.status !== "completed") return false;
      if (filter === "pending" && p.status !== "pending") return false;
      if (
        filter === "failed" &&
        (p.status === "completed" || p.status === "pending")
      ) {
        return false;
      }

      if (q) {
        const className = (p.enrollment?.class?.name || "").toLowerCase();
        const shortId = p._id.slice(-6).toLowerCase();
        const payhereId = (p.payhere_payment_id || "").toLowerCase();
        return (
          className.includes(q) ||
          shortId.includes(q) ||
          payhereId.includes(q)
        );
      }
      return true;
    });
  }, [payments, filter, searchQuery]);

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200/80 whitespace-nowrap">
            <CheckCircle2 size={12} /> Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-200/80 whitespace-nowrap">
            <Clock size={12} /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[11px] font-bold border border-red-200/80 whitespace-nowrap">
            <AlertCircle size={12} /> Failed
          </span>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    const isOnline = method === "payhere";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${isOnline
            ? "bg-blue-50 text-blue-700"
            : "bg-purple-50 text-purple-700"
          }`}
      >
        {isOnline ? <CreditCard size={13} /> : <Building2 size={13} />}
        <span>{isOnline ? "Online" : "Bank Slip"}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
              <Receipt size={13} />
              <span>Billing & Receipts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Payment History
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Review your past transactions, verify uploaded bank slips, and
              access official payment receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[120px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Total Paid
              </p>
              <p className="text-lg sm:text-xl font-black text-brand-jasmine mt-0.5">
                {PaymentService.formatCurrency(stats.totalPaid)}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[96px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Records
              </p>
              <p className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
                {stats.all}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FILTER & SEARCH TOOLBAR --- */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "all", label: "All", count: stats.all },
                { key: "completed", label: "Paid", count: stats.completed },
                { key: "pending", label: "Pending", count: stats.pending },
                { key: "failed", label: "Failed", count: stats.failed },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition-all ${active
                      ? "bg-white text-brand-prussian shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${active
                        ? "bg-brand-cerulean/10 text-brand-cerulean"
                        : "bg-gray-200/70 text-gray-500"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search class or ref ID..."
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-50 rounded-2xl border border-gray-100"
            />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <Receipt size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            No Payments Yet
          </h3>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            Your transaction history and receipts will appear here once you
            enroll in a class or lesson pack.
          </p>
        </motion.div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-base font-bold text-brand-prussian mb-1">
            No matching transactions found
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try clearing your search or switching the status filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilter("all");
            }}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* --- DESKTOP TABLE --- */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Class / Batch</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-brand-aliceBlue/20 transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 text-brand-cerulean flex items-center justify-center shrink-0">
                            <Calendar size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {moment(payment.paymentDate).format(
                                "MMM DD, YYYY"
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">
                              {moment(payment.paymentDate).format("h:mm A")}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-extrabold text-sm text-brand-prussian group-hover:text-brand-cerulean transition-colors">
                          {payment.enrollment?.class?.name || "Class Payment"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          REF #{payment._id.slice(-6).toUpperCase()}
                        </p>
                      </td>

                      <td className="px-6 py-5 font-mono font-extrabold text-sm text-brand-prussian whitespace-nowrap">
                        {PaymentService.formatCurrency(payment.amount)}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        {getMethodBadge(payment.method)}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>

                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        {payment.method === "payhere" &&
                          payment.status === "completed" ? (
                          <button
                            onClick={() => setViewReceipt(payment)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-aliceBlue/80 hover:bg-brand-prussian text-brand-prussian hover:text-white rounded-xl text-xs font-bold transition-colors active:scale-95"
                          >
                            <FileText size={14} />
                            <span>Receipt</span>
                          </button>
                        ) : payment.method === "bank_transfer" &&
                          payment.rawPayload?.slipUrl ? (
                          <button
                            onClick={() =>
                              setViewSlip(
                                getImageUrl(payment.rawPayload?.slipUrl) || ""
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl text-xs font-bold transition-colors active:scale-95"
                          >
                            <Eye size={14} />
                            <span>View Slip</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs font-medium">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- MOBILE CARDS --- */}
          <div className="md:hidden space-y-4">
            {filteredPayments.map((payment) => (
              <article
                key={payment._id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                      <Calendar size={11} className="text-brand-cerulean" />
                      {moment(payment.paymentDate).format(
                        "MMM DD, YYYY • h:mm A"
                      )}
                    </p>
                    <h3 className="font-extrabold text-brand-prussian text-base mt-1 line-clamp-1">
                      {payment.enrollment?.class?.name || "Class Payment"}
                    </h3>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                      REF #{payment._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(payment.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Amount
                    </p>
                    <p className="font-mono font-extrabold text-brand-prussian text-sm mt-0.5">
                      {PaymentService.formatCurrency(payment.amount)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                      Method
                    </p>
                    {getMethodBadge(payment.method)}
                  </div>
                </div>

                <div>
                  {payment.method === "payhere" &&
                    payment.status === "completed" ? (
                    <button
                      onClick={() => setViewReceipt(payment)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-aliceBlue/80 hover:bg-brand-prussian text-brand-prussian hover:text-white rounded-xl text-xs font-bold transition-colors active:scale-[0.98]"
                    >
                      <FileText size={15} />
                      <span>View Receipt</span>
                    </button>
                  ) : payment.method === "bank_transfer" &&
                    payment.rawPayload?.slipUrl ? (
                    <button
                      onClick={() =>
                        setViewSlip(
                          getImageUrl(payment.rawPayload?.slipUrl) || ""
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl text-xs font-bold transition-colors active:scale-[0.98]"
                    >
                      <Eye size={15} />
                      <span>View Bank Slip</span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold text-center">
                      No Actions Available
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* --- MODAL 1: VIEW BANK SLIP --- */}
      <AnimatePresence>
        {viewSlip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewSlip(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-brand-prussian flex items-center gap-2">
                  <Building2 size={16} className="text-purple-600" />
                  Uploaded Bank Slip
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={viewSlip}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-bold transition-colors"
                  >
                    <span>Original</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => setViewSlip(null)}
                    aria-label="Close slip viewer"
                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-100/70 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={viewSlip}
                  alt="Bank Slip"
                  className="max-w-full max-h-[68vh] object-contain rounded-2xl shadow-sm bg-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: OFFICIAL RECEIPT --- */}
      <AnimatePresence>
        {viewReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewReceipt(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-5 text-white flex justify-between items-center shrink-0 overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-brand-jasmine/20 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Payment Receipt
                  </h2>
                  <p className="text-white/75 text-xs mt-0.5">
                    Official Transaction Record
                  </p>
                </div>
                <button
                  onClick={() => setViewReceipt(null)}
                  aria-label="Close receipt"
                  className="relative z-10 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="flex-1 overflow-y-auto p-6" ref={receiptRef}>
                <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                  <div className="text-center border-b border-dashed border-gray-200 pb-5 mb-5">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-3xl font-black text-brand-prussian tracking-tight">
                      {PaymentService.formatCurrency(viewReceipt.amount)}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                      Payment Successful
                    </p>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-dashed border-gray-200/80">
                      <span className="text-gray-500 font-medium">
                        Transaction ID
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        {viewReceipt.payhere_payment_id || "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-dashed border-gray-200/80">
                      <span className="text-gray-500 font-medium">
                        Date & Time
                      </span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {moment(viewReceipt.paymentDate).format(
                            "MMM DD, YYYY"
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {moment(viewReceipt.paymentDate).format("h:mm A")}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-500 font-medium">Method</span>
                      <span className="font-bold text-gray-900 inline-flex items-center gap-1.5">
                        <CreditCard size={13} className="text-brand-cerulean" />
                        Online Card
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-100 mt-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Class Details
                    </p>
                    <p className="font-extrabold text-brand-prussian text-sm">
                      {viewReceipt.enrollment?.class?.name || "Class Payment"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Monthly Subscription
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Verified by SL Accounting LMS</span>
                  </div>
                </div>
              </div>

              {/* Footer Print Action */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewReceipt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-prussian hover:bg-brand-cerulean transition-colors shadow-sm"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}