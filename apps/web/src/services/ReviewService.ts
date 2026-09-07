import api from "./api"; // assuming there's a base api config

export interface ReviewData {
  _id: string;
  student: any; // Ideally we'd have a User type
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const ReviewService = {
  createOrUpdateReview: async (reviewData: { rating: number; comment: string }) => {
    const response = await api.post("/reviews", reviewData);
    return response.data;
  },

  getMyReview: async () => {
    const response = await api.get("/reviews/me");
    return response.data;
  },

  deleteMyReview: async () => {
    const response = await api.delete("/reviews/me");
    return response.data;
  },

  getApprovedReviews: async () => {
    const response = await api.get("/reviews/approved");
    return response.data;
  },

  getAllReviews: async () => {
    const response = await api.get("/reviews");
    return response.data;
  },

  updateReviewStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    const response = await api.put(`/reviews/${id}/status`, { status });
    return response.data;
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

export default ReviewService;
