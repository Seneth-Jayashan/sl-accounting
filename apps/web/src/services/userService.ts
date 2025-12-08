import { api } from "./api"; // Import the shared Axios instance
import type { User } from "../contexts/AuthContext";

// Define the base URL for this router.
const BASE_URL = "/users";

export interface UpdateProfilePayload {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: File | null;
}

// Define specific Student type for API responses if different from generic User
// You can merge this into your main types file later
export interface StudentUser extends User {
  batch?: string;
  status?: boolean;
}

const UserService = {
  // ==========================================
  // ADMIN ROUTES
  // ==========================================

  // GET /users (Admin Only)
  getAllUsers: async () => {
    const response = await api.get<{ success: boolean; users: User[] }>(BASE_URL);
    return response.data;
  },

  /**
   * GET /users/students
   * Fetch students with optional filtering.
   * Backend should handle query params: ?role=student&search=...&batch=...
   */
  getStudents: async (params?: { search?: string; batch?: string }) => {
    // Construct query string based on backend requirements
    // Example: /users?role=student OR /students
    // We assume your backend can filter users or has a specific endpoint.
    const response = await api.get<{ success: boolean; users: StudentUser[] }>(
      `${BASE_URL}`, 
      {
        params: {
          role: 'student', // Force filtering by role if using a generic /users endpoint
          ...params
        }
      }
    );
    console.log("Fetched Students:", response.data);
    return response.data;
  },

// POST /users/student (Admin Create Student)
  createStudent: async (data: any) => {
    // NOTE: Adjust the endpoint if your auth registration is different (e.g. /auth/register)
    // But usually admins have a specific route to create users without needing email verification immediately
    const response = await api.post<{ success: boolean; user: User; message: string }>(
      `${BASE_URL}/student`, 
      data
    );
    return response.data;
  },

  // GET /users/:id (Admin Only)
  getUserById: async (id: string) => {
    const response = await api.get<{ success: boolean; user: User }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // PUT /users/:id (Admin Update User)
  updateUser: async (id: string, data: Partial<User & { batch?: string; regNo?: string }>) => {
    const response = await api.put<{ success: boolean; user: User }>(
      `${BASE_URL}/${id}`, 
      data
    );
    return response.data;
  },

  // ==========================================
  // PROFILE MANAGEMENT
  // ==========================================

  // PUT /users/profile (Handles Multipart File Upload)
  updateUserProfile: async (data: UpdateProfilePayload) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);

    if (data.profileImage) {
      formData.append("profileImage", data.profileImage);
    }

    const response = await api.put<{ success: boolean; user: User }>(
      `${BASE_URL}/profile`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // PUT /users/email
  updateUserEmail: async (email: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${BASE_URL}/email`,
      { email }
    );
    return response.data;
  },

  // PUT /users/password
  updateUserPassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${BASE_URL}/password`,
      payload
    );
    return response.data;
  },

  // DELETE /users/delete-account
  deleteUserAccount: async () => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/delete-account`
    );
    return response.data;
  },

  // ==========================================
  // AUTH / RECOVERY
  // ==========================================

  forgetUserPassword: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/forget-password`,
      { email }
    );
    return response.data;
  },

  resetUserPassword: async (payload: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/reset-password`,
      payload
    );
    return response.data;
  },

  verifyUserEmail: async (payload: { email: string; otpCode: string }) => {
    const response = await api.post<{ success: boolean; user?: User; message: string }>(
      `${BASE_URL}/verify-email`,
      payload
    );
    return response.data;
  },

  resendVerificationOtp: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/resend-otp`,
      { email }
    );
    return response.data;
  },
};

export default UserService;