import api from "./api";
const BASE_URL = "/enrollments";
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
  coverImage?: string; // Added useful field for UI
}

// Main Response Interface
export interface EnrollmentResponse {
  _id: string;
  student: EnrolledStudent | string; // Object if populated, String ID if not
  class: EnrolledClass | string;     // Object if populated, String ID if not
  paymentStatus: "paid" | "unpaid" | "pending";
  isActive: boolean;
  enrollmentDate: string;
  accessEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for the Check Status response
interface CheckStatusResponse {
  isEnrolled: boolean;
  enrollment?: EnrollmentResponse;
}

const EnrollmentService = {
  /**
   * 1. Enroll the current user in a specific class
   * Endpoint: POST /api/v1/enrollments
   */
  enrollInClass: async (classId: string, studentId?: string) => {
    const payload = {
      class: classId,
      student: studentId, // Backend might take this from Token (req.user), but sending it is safe
      subscriptionType: "monthly",
      // accessStartDate is usually handled by backend to ensure server time, but can be sent if needed
    };

    try {
      const response = await api.post<EnrollmentResponse>(`${BASE_URL}`, payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("You are already enrolled in this class.");
      }
      throw new Error(error.response?.data?.message || "Enrollment failed. Please try again.");
    }
  },

  /**
   * 2. Check if user is already enrolled (Uses the new Router Endpoint)
   * Endpoint: GET /api/v1/enrollments/check/status?classId=...
   */
  checkEnrollmentStatus: async (classId: string): Promise<boolean> => {
    try {
      // Sending classId as a query parameter
      const response = await api.get<CheckStatusResponse>(`${BASE_URL}/check/status`, {
        params: { classId }
      });
      return response.data.isEnrolled;
    } catch (error) {
      // If 404 or other error, assume not enrolled
      return false;
    }
  },

  /**
   * 3. Get my enrollments (Student Side)
   * Endpoint: GET /api/v1/enrollments/my-enrollments
   */
  getMyEnrollments: async () => { 
    const response = await api.get<EnrollmentResponse[]>(`${BASE_URL}/my-enrollments`);
    return response.data;
  },

  /**
   * 4. Get a specific enrollment by ID
   * Endpoint: GET /api/v1/enrollments/:id
   */
  getEnrollmentById: async (id: string) => {
    const response = await api.get<EnrollmentResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * 5. Get all enrollments (Admin Side)
   * Endpoint: GET /api/v1/enrollments
   */
  getAllEnrollments: async (filters: { classId?: string; paymentStatus?: string; studentId?: string } = {}) => {
    const response = await api.get<EnrollmentResponse[]>(`${BASE_URL}`, { params: filters });
    return response.data;
  },

  /**
   * 6. Update Enrollment (Admin - e.g., Mark Paid, Disable Access)
   * Endpoint: PUT /api/v1/enrollments/:id
   */
  updateEnrollment: async (id: string, updateData: Partial<EnrollmentResponse>) => {
    const response = await api.put<EnrollmentResponse>(`${BASE_URL}/${id}`, updateData);
    return response.data;
  },

  /**
   * Helper: Specifically mark as paid (Uses updateEnrollment)
   */
  markPaymentAsPaid: async (id: string) => {
    return EnrollmentService.updateEnrollment(id, { paymentStatus: 'paid', isActive: true });
  },

  /**
   * 7. Delete/Cancel Enrollment (Admin)
   * Endpoint: DELETE /api/v1/enrollments/:id
   */
  deleteEnrollment: async (id: string) => {
    const response = await api.delete<{ message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default EnrollmentService;