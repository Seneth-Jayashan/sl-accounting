import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  MessageSquare,
  Check,
  X,
  Trash2,
  Star,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import ReviewService, { type ReviewData } from "../../services/ReviewService";

// --- Skeleton Loader ---

function ReviewsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
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

// --- Star Rating Display ---

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200 fill-slate-200"
              }`}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-brand-prussian tabular-nums">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// --- Main Component ---

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<ReviewData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ReviewService.getAllReviews();
      if (response.success && response.data) {
        setReviews(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch reviews.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      const response = await ReviewService.updateReviewStatus(id, status);
      if (response.success) {
        toast.success(response.message || `Review marked as ${status}.`);
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status } : r))
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${status} review.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await ReviewService.deleteReview(deleteTarget._id);
      if (response.success) {
        toast.success("Review deleted successfully.");
        setReviews((prev) => prev.filter((r) => r._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  // Derived Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const approved = reviews.filter((r) => r.status === "approved").length;
    const rejected = reviews.filter((r) => r.status === "rejected").length;
    const avgRating =
      total > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total
        : 0;

    return { total, pending, approved, rejected, avgRating };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;

      const name = `${r.student?.firstName || ""} ${r.student?.lastName || ""}`.toLowerCase();
      const regNo = (r.student?.regNo || "").toLowerCase();
      const comment = (r.comment || "").toLowerCase();
      return name.includes(q) || regNo.includes(q) || comment.includes(q);
    });
  }, [reviews, filter, searchQuery]);

  const filterTabs: { key: "all" | "pending" | "approved" | "rejected"; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Student Reviews
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Moderate student testimonials and monitor overall satisfaction.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-cerulean" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* LOADING SKELETON */}
      {isLoading && reviews.length === 0 ? (
        <ReviewsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg. Rating
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <h3 className="text-3xl font-bold text-brand-prussian tabular-nums">
                      {stats.avgRating.toFixed(1)}
                    </h3>
                    <span className="text-xs font-medium text-slate-400">/ 5.0</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Reviews
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-orange-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pending
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.pending}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Approved
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.approved}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* REVIEWS TABLE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, reg no, or comment..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Tabs with Counts */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
                {filterTabs.map((tab) => {
                  const active = filter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${active
                          ? "bg-white text-brand-prussian shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${active
                            ? "bg-brand-aliceBlue text-brand-cerulean"
                            : "bg-slate-200/60 text-slate-500"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            {filteredReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <MessageSquare className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  No reviews found
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try switching the status tab or adjusting your search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Rating</th>
                      <th className="px-6 py-3.5">Feedback</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReviews.map((review) => {
                      const isRowUpdating = updatingId === review._id;
                      const statusStyle =
                        review.status === "approved"
                          ? {
                            pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
                            dot: "bg-emerald-500",
                          }
                          : review.status === "rejected"
                            ? {
                              pill: "bg-rose-50 text-rose-700 ring-rose-600/15",
                              dot: "bg-rose-500",
                            }
                            : {
                              pill: "bg-amber-50 text-amber-700 ring-amber-600/15",
                              dot: "bg-amber-500",
                            };

                      return (
                        <tr
                          key={review._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {review.student?.firstName?.[0] || "?"}
                              </div>
                              <div>
                                <div className="font-semibold text-brand-prussian text-sm">
                                  {review.student?.firstName}{" "}
                                  {review.student?.lastName}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {review.student?.regNo || "No Reg No"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <StarRating rating={review.rating} />
                          </td>

                          <td className="px-6 py-4 max-w-md">
                            <p
                              className="text-sm text-slate-600 line-clamp-2 leading-relaxed"
                              title={review.comment}
                            >
                              {review.comment}
                            </p>
                            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                              {new Date(review.updatedAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ring-1 ${statusStyle.pill}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                              />
                              {review.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isRowUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-brand-cerulean mx-2" />
                              ) : (
                                <>
                                  {review.status !== "approved" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(review._id, "approved")
                                      }
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Approve review"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  {review.status !== "rejected" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(review._id, "rejected")
                                      }
                                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Reject review"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                onClick={() => setDeleteTarget(review)}
                                disabled={isRowUpdating}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 disabled:opacity-40"
                                title="Delete review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Delete student review?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to permanently delete the review from{" "}
                  <strong className="text-brand-prussian">
                    {deleteTarget.student?.firstName} {deleteTarget.student?.lastName}
                  </strong>
                  ? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;