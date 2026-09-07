import React, { useState, useEffect } from "react";
import { Loader2, MessageSquare, Check, X, Trash2, Star } from "lucide-react";
import toast from "react-hot-toast";
import ReviewService, { type ReviewData } from "../../services/ReviewService";

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
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
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await ReviewService.updateReviewStatus(id, status);
      if (response.success) {
        toast.success(response.message || `Review marked as ${status}.`);
        setReviews(reviews.map((r) => (r._id === id ? { ...r, status } : r)));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${status} review.`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const response = await ReviewService.deleteReview(id);
      if (response.success) {
        toast.success("Review deleted successfully.");
        setReviews(reviews.filter((r) => r._id !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review.");
    }
  };

  const filteredReviews = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-brand-cerulean w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-cerulean" />
            Student Reviews
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-1">Manage and moderate student feedback.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${filter === f ? 'bg-white text-brand-cerulean shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider font-sans text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Comment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-sans">
                    No reviews found for this filter.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-cerulean/10 flex items-center justify-center text-brand-prussian font-bold text-xs uppercase">
                          {review.student?.firstName?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-sans">
                            {review.student?.firstName} {review.student?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 font-sans">
                            {review.student?.regNo || 'No Reg No'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-yellow-400">
                        {review.rating} <Star className="w-4 h-4 ml-1 fill-current" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 font-sans line-clamp-2 max-w-md" title={review.comment}>
                        {review.comment}
                      </p>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${review.status === 'approved' ? 'bg-green-100 text-green-800' :
                          review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {review.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(review._id, 'approved')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(review._id, 'rejected')}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
