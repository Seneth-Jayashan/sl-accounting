import { api } from "./api"; // Shared Axios instance
import type { User } from "../contexts/AuthContext";

// --- CONFIGURATION ---
const USERS_BASE = "/users";
const AUTH_BASE = "/auth";

// --- TYPES ---

// Specific type for Student (extends base User)
export interface StudentUser extends User {
  batch?: string;
  regNo?: string;
  status?: boolean;
}

// Payload for Admin creating a student manually
export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  batch: string;
  password?: string; // Optional: Backend might generate this
}

// Payload for Admin updating any user
export interface AdminUpdatePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  batch?: string;
  status?: boolean;
}

// Payload for User updating their own profile
export interface UpdateProfilePayload {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: File | null;
}

// --- SERVICE ---

const UserService = {
  // ==========================================
  // ADMIN ROUTES (Requires role: 'admin')
  // ==========================================

  // GET /users (Fetch all users)
  getAllUsers: async () => {
    const response = await api.get<{ success: boolean; users: User[] }>(USERS_BASE);
    return response.data;
  },

  /**
   * GET /users
   * Fetch students specifically. 
   * Security Note: Backend should validate 'role=student' query param to prevent leaking Admin data.
   */
  getStudents: async (params?: { search?: string; batch?: string }) => {
    const response = await api.get<{ success: boolean; users: StudentUser[] }>(
      USERS_BASE, 
      {
        params: {
          role: 'student', // Filter by role
          ...params
        }
      }
    );
    return response.data;
  },

  // POST /users/student (Admin manually creates a student)
  createStudent: async (data: CreateStudentPayload) => {
    const response = await api.post<{ success: boolean; user: User; message: string }>(
      `${USERS_BASE}/student`, 
      data
    );
    return response.data;
  },

  // GET /users/:id
  getUserById: async (id: string) => {
    const response = await api.get<{ success: boolean; user: User }>(`${USERS_BASE}/${id}`);
    return response.data;
  },

  // PUT /users/:id (Admin updates user details)
  updateUser: async (id: string, data: AdminUpdatePayload) => {
    const response = await api.put<{ success: boolean; user: User }>(
      `${USERS_BASE}/${id}`, 
      data
    );
    return response.data;
  },

  // ==========================================
  // PROFILE MANAGEMENT (Self Service)
  // ==========================================

  // PUT /users/profile (Multipart upload)
  updateUserProfile: async (data: UpdateProfilePayload) => {
    const formData = new FormData();
    // Security: Explicitly append fields to prevent prototype pollution
    formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);

    if (data.profileImage) {
      // Security: Backend must validate file type (Magic Bytes)
      formData.append("profileImage", data.profileImage);
    }

    const response = await api.put<{ success: boolean; user: User }>(
      `${USERS_BASE}/profile`,
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
      `${USERS_BASE}/email`,
      { email }
    );
    return response.data;
  },

  // PUT /users/password
  updateUserPassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${USERS_BASE}/password`,
      payload
    );
    return response.data;
  },

  // DELETE /users/delete-account
  deleteUserAccount: async () => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${USERS_BASE}/delete-account`
    );
    return response.data;
  },

  // ==========================================
  // AUTH / RECOVERY (Usually on /auth route)
  // ==========================================

  // POST /auth/forget-password
  forgetUserPassword: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${AUTH_BASE}/forget-password`,
      { email }
    );
    return response.data;
  },

  // POST /auth/reset-password
  resetUserPassword: async (payload: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${AUTH_BASE}/reset-password`,
      payload
    );
    return response.data;
  },

  // POST /auth/verify-email
  verifyUserEmail: async (payload: { email: string; otpCode: string }) => {
    const response = await api.post<{ success: boolean; user?: User; message: string }>(
      `${AUTH_BASE}/verify-email`,
      payload
    );
    return response.data;
  },

  // POST /auth/resend-otp
  resendVerificationOtp: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${AUTH_BASE}/resend-otp`, // Usually this is an auth action
      { email }
    );
    return response.data;
  },
};

export default UserService;