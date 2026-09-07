import React, { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import ReviewService, { type ReviewData } from "../../services/ReviewService";

const MyReview: React.FC = () => {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.error("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ReviewService.createOrUpdateReview({ rating, comment });
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    setIsSubmitting(true);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-brand-cerulean w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-cerulean/10 flex items-center justify-center">
            <MessageSquare className="text-brand-cerulean w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-sans">Course Feedback</h2>
            <p className="text-sm text-gray-500 font-sans mt-1">Share your experience with us.</p>
          </div>
        </div>

        {review && (
          <div className={`mb-6 p-4 rounded-xl border ${review.status === 'approved' ? 'bg-green-50 border-green-200' : review.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${review.status === 'approved' ? 'text-green-600' : review.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`font-semibold ${review.status === 'approved' ? 'text-green-900' : review.status === 'rejected' ? 'text-red-900' : 'text-yellow-900'}`}>
                  Status: {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </h4>
                <p className={`text-sm mt-1 ${review.status === 'approved' ? 'text-green-700' : review.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`}>
                  {review.status === 'approved' && "Your review is public and visible on the home page."}
                  {review.status === 'pending' && "Your review is pending approval from an admin."}
                  {review.status === 'rejected' && "Your review was rejected. Please contact support if you have questions."}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-sans mb-3">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-transform hover:scale-110 focus:outline-none`}
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 font-sans mb-2">
              Your Feedback
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like about the course? How can we improve?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all font-sans text-sm resize-y"
            ></textarea>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-cerulean text-white font-medium rounded-xl hover:bg-brand-cerulean/90 focus:ring-4 focus:ring-brand-cerulean/20 transition-all font-sans disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {review ? "Update Review" : "Submit Review"}
            </button>
            {review && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all font-sans disabled:opacity-70"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyReview;
