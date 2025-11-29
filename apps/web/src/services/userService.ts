import { api } from "./api"; // Import the shared Axios instance
import type { User } from "../contexts/AuthContext";

// Define the base URL for this router. 
// ⚠️ NOTE: Update this if your backend mounts this router at a different path (e.g. app.use('/api/v1/users', userRouter))
const BASE_URL = "/users"; 

export interface UpdateProfilePayload {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: File | null;
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

  // GET /users/:id (Admin Only)
  getUserById: async (id: string) => {
    const response = await api.get<{ success: boolean; user: User }>(`${BASE_URL}/${id}`);
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
    
    // "profileImage" matches the string in your createUploader middleware
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
  // AUTH / RECOVERY (Public or Hybrid)
  // ==========================================

  // POST /users/forget-password
  forgetUserPassword: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/forget-password`, 
      { email }
    );
    return response.data;
  },

  // POST /users/reset-password
  // Note: Adjust payload fields based on your 'resetPasswordSchema' (usually requires otp + newPassword + email)
  resetUserPassword: async (payload: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/reset-password`, 
      payload
    );
    return response.data;
  },

  // POST /users/verify-email
  verifyUserEmail: async (payload: { email: string; otpCode: string }) => {
    const response = await api.post<{ success: boolean; user?: User; message: string }>(
      `${BASE_URL}/verify-email`, 
      payload
    );
    return response.data;
  },

  // POST /users/resend-otp
  resendVerificationOtp: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/resend-otp`, 
      { email }
    );
    return response.data;
  },
};

export default UserService;