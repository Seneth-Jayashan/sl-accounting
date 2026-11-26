import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ClipboardCheck,
  Search,
  X,
  Copy,
  Check,
  Calendar,
  Loader2,
  Sparkles,
} from "lucide-react";
import TuteDeliveryService, {
  type TuteDeliveryData,
} from "../../../services/TuteDeliveryService";

type DeliveryFilter = "all" | "shipped" | "pending" | "delivered";

// Format "2026-11" -> { monthShort: "NOV", year: "2026", label: "November 2026" }
const formatTargetMonth = (targetMonth?: string) => {
  if (!targetMonth) return { monthShort: "--", year: "", label: "Unknown" };
  const [year, month] = targetMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (isNaN(date.getTime())) {
    return { monthShort: month || "--", year: year || "", label: targetMonth };
  }
  return {
    monthShort: date.toLocaleDateString("en-US", { month: "short" }),
    year: year || "",
    label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
};

export default function MyTutesPage() {
  const [deliveries, setDeliveries] = useState<TuteDeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TuteDeliveryData | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filter, setFilter] = useState<DeliveryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Data
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TuteDeliveryService.getMyDeliveries();
      setDeliveries(data || []);
    } catch (error) {
      console.error("Failed to load deliveries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Copy Tracking ID
  const handleCopyTracking = (trackingId: string, id: string) => {
    navigator.clipboard.writeText(trackingId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Confirm Receipt Action
  const executeConfirmReceipt = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget._id;

    setProcessingId(id);
    setConfirmTarget(null);
    try {
      await TuteDeliveryService.markAsDelivered(id);
      setDeliveries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: "delivered" } : d))
      );
    } catch (error) {
      alert("Action failed. Please check your connection.");
    } finally {
      setProcessingId(null);
    }
  };

  // Stats & Counts
  const counts = useMemo(() => {
    const shipped = deliveries.filter((d) => d.status === "shipped").length;
    const delivered = deliveries.filter((d) => d.status === "delivered").length;
    const pending = deliveries.length - shipped - delivered;
    return { all: deliveries.length, shipped, pending, delivered };
  }, [deliveries]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return deliveries.filter((d) => {
      if (filter === "shipped" && d.status !== "shipped") return false;
      if (filter === "delivered" && d.status !== "delivered") return false;
      if (
        filter === "pending" &&
        (d.status === "shipped" || d.status === "delivered")
      ) {
        return false;
      }

      if (q) {
        const className = (d.class?.name || "").toLowerCase();
        const month = (d.targetMonth || "").toLowerCase();
        const tracking = (d.trackingId || "").toLowerCase();
        const courier = (d.courierService || "").toLowerCase();
        return (
          className.includes(q) ||
          month.includes(q) ||
          tracking.includes(q) ||
          courier.includes(q)
        );
      }
      return true;
    });
  }, [deliveries, filter, searchQuery]);

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
              <Package size={13} />
              <span>Physical Tute Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Study Packs
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Track your printed tutes, check courier details, and confirm
              delivery once your package arrives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[92px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                On the Way
              </p>
              <p className="text-xl font-black text-brand-jasmine mt-0.5">
                {counts.shipped}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[92px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Received
              </p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">
                {counts.delivered}
              </p>
            </div>

            <button
              onClick={fetchDeliveries}
              disabled={loading}
              title="Refresh Deliveries"
              aria-label="Refresh Deliveries"
              className="h-[62px] px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white flex items-center justify-center transition-colors active:scale-95 disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </section>

      {/* --- FILTER & SEARCH TOOLBAR --- */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {(
            [
              { key: "all", label: "All Packs", count: counts.all },
              { key: "shipped", label: "On the Way", count: counts.shipped },
              { key: "pending", label: "Processing", count: counts.pending },
              { key: "delivered", label: "Received", count: counts.delivered },
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
            placeholder="Search class, month, tracking..."
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

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-50 rounded-2xl border border-gray-100"
            />
          ))}
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <Package size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            {searchQuery || filter !== "all"
              ? "No Matching Deliveries"
              : "No Deliveries Yet"}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            {searchQuery || filter !== "all"
              ? "Try adjusting your search or filter selection."
              : "Your physical tute packages will appear here once your monthly payment is approved."}
          </p>
          {(searchQuery || filter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-[11px] uppercase text-gray-400 font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Study Pack & Month</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Courier & Tracking</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {filteredDeliveries.map((delivery) => {
                      const monthInfo = formatTargetMonth(delivery.targetMonth);
                      const isShipped = delivery.status === "shipped";
                      const isDelivered = delivery.status === "delivered";
                      const isProcessing = processingId === delivery._id;

                      return (
                        <motion.tr
                          key={delivery._id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-brand-aliceBlue/20 transition-colors"
                        >
                          {/* Class & Month */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-brand-aliceBlue/70 border border-brand-cerulean/15 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] font-extrabold uppercase text-brand-cerulean leading-none">
                                  {monthInfo.monthShort}
                                </span>
                                <span className="text-xs font-black text-brand-prussian mt-0.5">
                                  {monthInfo.year.slice(-2) || "--"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-brand-prussian group-hover:text-brand-cerulean transition-colors">
                                  {delivery.class?.name || "Class Tute Pack"}
                                </p>
                                <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                  <Calendar size={11} />
                                  {monthInfo.label}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">
                            <StatusBadge status={delivery.status} />
                          </td>

                          {/* Courier & Tracking */}
                          <td className="px-6 py-5">
                            {isShipped || isDelivered ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                  <Truck
                                    size={14}
                                    className="text-brand-cerulean"
                                  />
                                  <span>
                                    {delivery.courierService || "SL Post"}
                                  </span>
                                </div>
                                {delivery.trackingId ? (
                                  <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                                    <span className="text-xs font-mono font-bold text-gray-600 select-all">
                                      {delivery.trackingId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyTracking(
                                          delivery.trackingId!,
                                          delivery._id
                                        )
                                      }
                                      className="text-gray-400 hover:text-brand-cerulean transition-colors"
                                      title="Copy Tracking ID"
                                    >
                                      {copiedId === delivery._id ? (
                                        <Check
                                          size={13}
                                          className="text-emerald-500"
                                        />
                                      ) : (
                                        <Copy size={13} />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">
                                    No tracking ID provided
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                Preparing for dispatch
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-6 py-5 text-right">
                            {isShipped ? (
                              <button
                                onClick={() => setConfirmTarget(delivery)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <ClipboardCheck size={14} />
                                )}
                                <span>Mark Received</span>
                              </button>
                            ) : isDelivered ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                <CheckCircle2 size={14} />
                                Completed
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-400">
                                Pending Dispatch
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredDeliveries.map((delivery) => {
                const monthInfo = formatTargetMonth(delivery.targetMonth);
                const isShipped = delivery.status === "shipped";
                const isDelivered = delivery.status === "delivered";
                const isProcessing = processingId === delivery._id;

                return (
                  <motion.article
                    key={delivery._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4"
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-cerulean uppercase tracking-wider">
                          <Calendar size={11} />
                          {monthInfo.label}
                        </span>
                        <h3 className="text-base font-extrabold text-brand-prussian mt-1 leading-snug">
                          {delivery.class?.name || "Class Tute Pack"}
                        </h3>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>

                    {/* 3-Step Mini Progress Bar */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="h-1.5 rounded-full bg-brand-cerulean" />
                      <div
                        className={`h-1.5 rounded-full ${isShipped || isDelivered
                            ? "bg-brand-cerulean"
                            : "bg-gray-100"
                          }`}
                      />
                      <div
                        className={`h-1.5 rounded-full ${isDelivered ? "bg-emerald-500" : "bg-gray-100"
                          }`}
                      />
                    </div>

                    {/* Courier Info Box */}
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-bold text-gray-700">
                          <Truck size={14} className="text-brand-cerulean" />
                          {delivery.courierService || "Pending Courier"}
                        </span>
                        {delivery.sentAt && (
                          <span className="text-[11px] text-gray-400 font-medium">
                            Sent{" "}
                            {new Date(delivery.sentAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {delivery.trackingId && (
                        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200/80">
                          <span className="text-xs font-mono font-bold text-gray-700 truncate">
                            {delivery.trackingId}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyTracking(
                                delivery.trackingId!,
                                delivery._id
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-cerulean ml-2 shrink-0"
                          >
                            {copiedId === delivery._id ? (
                              <>
                                <Check size={13} className="text-emerald-500" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isShipped && (
                      <button
                        onClick={() => setConfirmTarget(delivery)}
                        disabled={isProcessing}
                        className="w-full py-3 rounded-2xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        {isProcessing ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <ClipboardCheck size={16} />
                        )}
                        <span>Mark as Received</span>
                      </button>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* --- CONFIRM RECEIPT MODAL --- */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setConfirmTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles size={26} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-brand-prussian">
                  Confirm Package Receipt?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Please confirm that you have physically received your{" "}
                  <strong className="text-gray-800">
                    {formatTargetMonth(confirmTarget.targetMonth).label}
                  </strong>{" "}
                  tute pack for{" "}
                  <strong className="text-gray-800">
                    {confirmTarget.class?.name}
                  </strong>
                  .
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmTarget(null)}
                  className="py-2.5 text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmReceipt}
                  className="py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm"
                >
                  Yes, Received
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { classes: string; icon: React.ReactNode; label: string }
  > = {
    delivered: {
      classes: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: <CheckCircle2 size={12} />,
      label: "Received",
    },
    shipped: {
      classes: "bg-blue-50 text-blue-700 border-blue-100",
      icon: <Truck size={12} />,
      label: "On the Way",
    },
    pending: {
      classes: "bg-amber-50 text-amber-700 border-amber-100",
      icon: <Clock size={12} />,
      label: "Processing",
    },
  };

  const current = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${current.classes}`}
    >
      {status === "shipped" && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}