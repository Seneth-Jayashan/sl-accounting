import Review from "../models/Review.js";

// @desc    Create or Update a Review
// @route   POST /api/v1/reviews
// @access  Private (Student)
export const createOrUpdateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const studentId = req.user._id;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Please provide rating and comment." });
    }

    let review = await Review.findOne({ student: studentId });

    if (review) {
      // Update existing review and set status to pending
      review.rating = rating;
      review.comment = comment;
      review.status = "pending";
      await review.save();
      return res.status(200).json({ success: true, message: "Review updated and sent for approval.", data: review });
    } else {
      // Create new review
      review = await Review.create({
        student: studentId,
        rating,
        comment,
      });
      return res.status(201).json({ success: true, message: "Review submitted for approval.", data: review });
    }
  } catch (error) {
    console.error("Error in createOrUpdateReview: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get my review
// @route   GET /api/v1/reviews/me
// @access  Private (Student)
export const getMyReview = async (req, res) => {
  try {
    const studentId = req.user._id;
    const review = await Review.findOne({ student: studentId });
    
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error("Error in getMyReview: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Delete my review
// @route   DELETE /api/v1/reviews/me
// @access  Private (Student)
export const deleteMyReview = async (req, res) => {
  try {
    const studentId = req.user._id;
    const review = await Review.findOneAndDelete({ student: studentId });
    
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    return res.status(200).json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    console.error("Error in deleteMyReview: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get Approved Reviews (Public for Home Page)
// @route   GET /api/v1/reviews/approved
// @access  Public
export const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: "approved" })
      .populate({
        path: "student",
        select: "firstName lastName profileImage batch",
        populate: {
          path: "batch",
          select: "name",
        },
      })
      .sort("-updatedAt")
      .limit(20);

    res.status(200).json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    console.error("Error in getApprovedReviews: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get All Reviews (Admin)
// @route   GET /api/v1/reviews
// @access  Private (Admin)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("student", "firstName lastName profileImage regNo")
      .sort("-createdAt");

    res.status(200).json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    console.error("Error in getAllReviews: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Update Review Status (Admin)
// @route   PUT /api/v1/reviews/:id/status
// @access  Private (Admin)
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    res.status(200).json({ success: true, message: `Review status updated to ${status}.`, data: review });
  } catch (error) {
    console.error("Error in updateReviewStatus: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Delete a Review (Admin)
// @route   DELETE /api/v1/reviews/:id
// @access  Private (Admin)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    res.status(200).json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    console.error("Error in deleteReview: ", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
