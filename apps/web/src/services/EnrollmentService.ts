import { api } from "./api";

const BASE_URL = "/enrollments";

// --- INTERFACES ---

export interface EnrolledStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface EnrolledClass {
  _id: string;
  name: string;
  price: number;
  coverImage?: string;
  subject?: string; // Added subject based on usage in GetEnrollmentById
}

// RENAME: Changed 'EnrollmentData' to 'EnrollmentResponse' to match Component
export interface EnrollmentResponse {
  _id: string;
  student: EnrolledStudent | string;
  class: EnrolledClass | string;
  paymentStatus: "paid" | "unpaid" | "pending" | "refunded";
  isActive: boolean;
  enrollmentDate: string; // ISO String
  accessEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckStatusResponse {
  isEnrolled: boolean;
  enrollment?: EnrollmentResponse;
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
   */
  enrollInClass: async (classId: string, studentId?: string) => {
    const payload: any = {
      class: classId,
      subscriptionType: "monthly",
    };

    if (studentId) {
      payload.student = studentId;
    }

    try {
      const response = await api.post<EnrollmentResponse>(BASE_URL, payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("You are already enrolled in this class.");
      }
      throw new Error(error.response?.data?.message || "Enrollment failed.");
    }
  },

  /**
   * 2. Check enrollment status
   */
  checkEnrollmentStatus: async (classId: string): Promise<boolean> => {
    try {
      const response = await api.get<CheckStatusResponse>(`${BASE_URL}/check/status`, {
        params: { classId }
      });
      return response.data.isEnrolled;
    } catch (error) {
      return false;
    }
  },

  /**
   * 3. Get current user's enrollments
   */
  getMyEnrollments: async () => {
    // Returns EnrollmentResponse[]
    const response = await api.get<EnrollmentResponse[]>(`${BASE_URL}/my-enrollments`);
    return response.data;
  },

  /**
   * 4. Get specific enrollment details
   */
  getEnrollmentById: async (id: string) => {
    const response = await api.get<EnrollmentResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * 5. Get all enrollments (Admin)
   */
  getAllEnrollments: async (params: EnrollmentFilterParams = {}) => {
    const response = await api.get<EnrollmentResponse[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * 6. Update Enrollment (Admin)
   */
  updateEnrollment: async (id: string, updateData: Partial<EnrollmentResponse>) => {
    const response = await api.put<EnrollmentResponse>(`${BASE_URL}/${id}`, updateData);
    return response.data;
  },

  /**
   * Helper: Mark Paid
   */
  markPaymentAsPaid: async (id: string) => {
    return EnrollmentService.updateEnrollment(id, { paymentStatus: 'paid', isActive: true });
  },

  /**
   * 7. Delete Enrollment (Admin)
   */
  deleteEnrollment: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default EnrollmentService;