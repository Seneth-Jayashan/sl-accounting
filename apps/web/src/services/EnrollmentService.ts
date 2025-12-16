import api from "./api";

// --- Interfaces ---

// Detailed Student Type (Populated)
export interface EnrolledStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
}

// Detailed Class Type (Populated)
export interface EnrolledClass {
  _id: string;
  name: string;
  price: number;
}

// Main Response Interface
export interface EnrollmentResponse {
  _id: string;
  student: EnrolledStudent | string; // Can be object (populated) or string (ID)
  class: EnrolledClass | string;     // Can be object (populated) or string (ID)
  paymentStatus: "paid" | "unpaid" | "pending";
  isActive: boolean;
  accessEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

const EnrollmentService = {
  /**
   * Enroll the current user in a specific class
   * Endpoint: POST /api/v1/enrollments
   */
  enrollInClass: async (classId: string, studentId: string) => {
    if (!studentId) {
      throw "User ID is missing. Please login again.";
    }

    const payload = {
      student: studentId,
      class: classId,
      subscriptionType: "monthly",
      accessStartDate: new Date().toISOString()
    };

    try {
      const response = await api.post<EnrollmentResponse>("/enrollments", payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw "You are already enrolled in this class.";
      }
      throw error.response?.data?.message || "Enrollment failed. Please try again.";
    }
  },

  /**
   * Check if user is already enrolled
   */
  checkEnrollmentStatus: async (classId: string) => {
    try {
      // Fallback if no dedicated check endpoint exists
      return false; 
    } catch (error) {
      return false;
    }
  },

  /**
   * Get a specific enrollment by ID
   * Endpoint: GET /api/v1/enrollments/:id
   */
  getEnrollmentById: async (id: string) => {
    const response = await api.get<EnrollmentResponse>(`/enrollments/${id}`);
    return response.data;
  },

  /**
   * Get all enrollments (Admin)
   */
  getAllEnrollments: async (filters: { classId?: string; paymentStatus?: string } = {}) => {
    const response = await api.get<EnrollmentResponse[]>("/enrollments", { params: filters });
    return response.data;
  },

  /**
   * Get my enrollments (Student)
   */
  getMyEnrollments: async () => { 
    const response = await api.get<EnrollmentResponse[]>("/enrollments/my-enrollments");
    return response.data;
  },

  /**
   * Mark an enrollment as PAID (Admin)
   */
  markPaymentAsPaid: async (enrollmentId: string) => {
    const payload = { paymentStatus: 'paid' };
    const response = await api.put<EnrollmentResponse>(`/enrollments/${enrollmentId}`, payload);
    return response.data;
  },

  /**
   * Cancel Enrollment (Delete)
   */
  cancelEnrollment: async (id: string) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },
};

export default EnrollmentService;