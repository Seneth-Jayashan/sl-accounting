import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Loader2,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Send,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import ReviewService, { type ReviewData } from "../../services/ReviewService";

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Poor", color: "text-red-500 bg-red-50 border-red-100" },
  2: { label: "Fair", color: "text-orange-500 bg-orange-50 border-orange-100" },
  3: { label: "Good", color: "text-amber-600 bg-amber-50 border-amber-100" },
  4: { label: "Very Good", color: "text-sky-600 bg-sky-50 border-sky-100" },
  5: {
    label: "Excellent!",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
};

const MAX_COMMENT_LENGTH = 500;

const MyReview: React.FC = () => {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchReview();
  }, []);

  const fetchReview = async () => {
    try {
      const response = await ReviewService.getMyReview();
      if (response.success && response.data) {
        setReview(response.data);
        setRating(response.data.rating);
        setComment(response.data.comment);
      }
    } catch (error) {
      console.error("Failed to fetch review:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write your feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ReviewService.createOrUpdateReview({
        rating,
        comment: comment.trim(),
      });
      if (response.success) {
        toast.success(response.message || "Review submitted successfully.");
        setReview(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    setIsSubmitting(true);
    setShowDeleteModal(false);
    try {
      const response = await ReviewService.deleteMyReview();
      if (response.success) {
        toast.success(response.message || "Review deleted successfully.");
        setReview(null);
        setRating(0);
        setComment("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOADING SKELETON ---
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-pulse">
        <div className="h-36 rounded-[2rem] bg-gray-200" />
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 space-y-6">
          <div className="h-16 bg-gray-100 rounded-2xl" />
          <div className="h-12 w-56 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-12 w-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const activeRating = hoveredRating || rating;
  const activeRatingMeta = activeRating ? RATING_LABELS[activeRating] : null;

  const statusConfig = review
    ? review.status === "approved"
      ? {
        bg: "bg-emerald-50/70 border-emerald-200/80",
        iconBg: "bg-emerald-100 text-emerald-600",
        titleColor: "text-emerald-900",
        textColor: "text-emerald-700",
        icon: CheckCircle2,
        label: "Approved & Public",
        desc: "Your review is live and visible on the home page. Thank you for sharing!",
      }
      : review.status === "rejected"
        ? {
          bg: "bg-red-50/70 border-red-200/80",
          iconBg: "bg-red-100 text-red-600",
          titleColor: "text-red-900",
          textColor: "text-red-700",
          icon: XCircle,
          label: "Not Approved",
          desc: "Your review was not approved for public display. You can update and resubmit it anytime.",
        }
        : {
          bg: "bg-amber-50/70 border-amber-200/80",
          iconBg: "bg-amber-100 text-amber-600",
          titleColor: "text-amber-900",
          textColor: "text-amber-800",
          icon: Clock,
          label: "Pending Approval",
          desc: "Your review has been received and is awaiting admin approval.",
        }
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-2.5">
              <Sparkles size={12} />
              <span>Student Feedback</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Course Feedback
            </h1>
            <p className="text-white/75 text-sm mt-1 max-w-lg">
              Share your learning experience to help us improve and guide
              future students.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 self-start sm:self-center">
            <MessageSquare size={22} className="text-brand-jasmine" />
          </div>
        </div>
      </section>

      {/* --- MAIN CARD --- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6"
      >
        {/* Status Callout */}
        {statusConfig && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${statusConfig.bg}`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statusConfig.iconBg}`}
            >
              <statusConfig.icon size={18} />
            </div>
            <div>
              <h4 className={`text-sm font-extrabold ${statusConfig.titleColor}`}>
                Status: {statusConfig.label}
              </h4>
              <p className={`text-xs sm:text-sm mt-0.5 leading-relaxed ${statusConfig.textColor}`}>
                {statusConfig.desc}
              </p>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Your Rating <span className="text-red-500">*</span>
              </label>

              <AnimatePresence mode="wait">
                {activeRatingMeta && (
                  <motion.span
                    key={activeRating}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${activeRatingMeta.color}`}
                  >
                    {activeRating}/5 • {activeRatingMeta.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div
              className="inline-flex items-center gap-1.5 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeRating;
                return (
                  <motion.button
                    key={star}
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`transition-colors duration-150 ${isFilled
                          ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                          : "text-gray-200 hover:text-amber-200"
                        }`}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="comment"
                className="block text-xs font-extrabold uppercase tracking-wider text-gray-500"
              >
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-semibold ${comment.length >= MAX_COMMENT_LENGTH
                    ? "text-red-500"
                    : "text-gray-400"
                  }`}
              >
                {comment.length} / {MAX_COMMENT_LENGTH}
              </span>
            </div>

            <textarea
              id="comment"
              rows={5}
              maxLength={MAX_COMMENT_LENGTH}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you enjoy most about the classes, recordings, or study materials? How can we make it even better?"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-brand-prussian hover:bg-brand-cerulean text-white text-sm font-bold rounded-xl shadow-md shadow-brand-prussian/15 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{review ? "Updating..." : "Submitting..."}</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>{review ? "Update Review" : "Submit Review"}</span>
                </>
              )}
            </button>

            {review && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} />
                <span>Delete Review</span>
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setShowDeleteModal(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="w-13 h-13 p-3 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-brand-prussian">
                  Delete Your Review?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                  This will permanently remove your rating and feedback. You can
                  always submit a new review later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowDeleteModal(false)}
                  className="py-2.5 text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={executeDelete}
                  className="py-2.5 text-xs sm:text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyReview;