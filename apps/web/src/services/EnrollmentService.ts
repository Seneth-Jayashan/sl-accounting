import { api } from "./api";

const BASE_URL = "/enrollments";

// --- INTERFACES ---

export interface EnrolledStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // Standardized to match User model (was 'mobile')
}

export interface EnrolledClass {
  _id: string;
  name: string;
  price: number;
  coverImage?: string;
}

export interface EnrollmentData {
  _id: string;
  student: EnrolledStudent | string; // Object if populated, String ID if not
  class: EnrolledClass | string;     // Object if populated, String ID if not
  paymentStatus: "paid" | "unpaid" | "pending" | "refunded";
  isActive: boolean;
  enrollmentDate: string; // ISO String
  accessEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckStatusResponse {
  isEnrolled: boolean;
  enrollment?: EnrollmentData;
}

interface EnrollmentFilterParams {
  classId?: string;
  paymentStatus?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}

// --- SERVICE ---

const EnrollmentService = {
  /**
   * 1. Enroll in a class
   * Endpoint: POST /api/v1/enrollments
   * Security Note: Backend should prioritize req.user.id for 'student' role.
   * 'studentId' param is only for Admins enrolling others.
   */
  enrollInClass: async (classId: string, studentId?: string) => {
    const payload: any = {
      class: classId,
      subscriptionType: "monthly",
    };

    // Only attach studentId if explicitly provided (e.g. Admin action)
    if (studentId) {
      payload.student = studentId;
    }

    try {
      const response = await api.post<EnrollmentData>(BASE_URL, payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("You are already enrolled in this class.");
      }
      throw new Error(error.response?.data?.message || "Enrollment failed. Please try again.");
    }
  },

  /**
   * 2. Check enrollment status
   * Endpoint: GET /api/v1/enrollments/check/status
   */
  checkEnrollmentStatus: async (classId: string): Promise<boolean> => {
    try {
      const response = await api.get<CheckStatusResponse>(`${BASE_URL}/check/status`, {
        params: { classId }
      });
      return response.data.isEnrolled;
    } catch (error) {
      return false; // Safely assume not enrolled on error
    }
  },

  /**
   * 3. Get current user's enrollments
   * Endpoint: GET /api/v1/enrollments/my-enrollments
   */
  getMyEnrollments: async () => {
    const response = await api.get<EnrollmentData[]>(`${BASE_URL}/my-enrollments`);
    return response.data;
  },

  /**
   * 4. Get specific enrollment details
   * Endpoint: GET /api/v1/enrollments/:id
   */
  getEnrollmentById: async (id: string) => {
    const response = await api.get<EnrollmentData>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * 5. Get all enrollments (Admin Dashboard)
   * Endpoint: GET /api/v1/enrollments
   */
  getAllEnrollments: async (params: EnrollmentFilterParams = {}) => {
    const response = await api.get<EnrollmentData[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * 6. Update Enrollment (Admin Only)
   * Endpoint: PUT /api/v1/enrollments/:id
   */
  updateEnrollment: async (id: string, updateData: Partial<EnrollmentData>) => {
    const response = await api.put<EnrollmentData>(`${BASE_URL}/${id}`, updateData);
    return response.data;
  },

  /**
   * Helper: Quickly mark enrollment as paid
   */
  markPaymentAsPaid: async (id: string) => {
    return EnrollmentService.updateEnrollment(id, { paymentStatus: 'paid', isActive: true });
  },

  /**
   * 7. Delete Enrollment (Admin Only)
   * Endpoint: DELETE /api/v1/enrollments/:id
   */
  deleteEnrollment: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default EnrollmentService;