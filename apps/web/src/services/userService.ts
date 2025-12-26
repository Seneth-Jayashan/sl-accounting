import { api } from "./api"; 


// --- CONFIGURATION ---
const USERS_BASE = "/users"; // Public/Shared endpoints
const AUTH_BASE = "/auth";   // Auth endpoints
const ADMIN_BASE = "/admin"; // Admin-only management endpoints

// --- TYPES ---

// Base User Interface
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin' | 'tutor';
  profileImage?: string;
  phoneNumber?: string;
  isVerified: boolean; 
  isActive: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  createdAt?: string;
}

// Specific type for Student
export interface StudentUser extends User {
  address?: string;
  batch?: string | { _id: string; name: string };
  regNo?: string;
  lastLogin?: string;
}

// Payload for Admin creating a student
export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  batch: string;
  password?: string;
}

// Payload for Admin updating user details
export interface AdminUpdatePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  batch?: string;
  isActive?: boolean;
}

// Payload for Self-Service Profile Update
export interface UpdateProfilePayload {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: File | null;
}

// --- SERVICE ---

const UserService = {
  // ==========================================
  // 1. READ OPERATIONS (Shared/Public)
  // ==========================================

  // GET /users
  getAllUsers: async () => {
    const response = await api.get<{ success: boolean; users: User[] }>(USERS_BASE);
    return response.data;
  },

  // GET /users (Filtered for Students)
  getStudents: async (params?: { search?: string; batch?: string }) => {
    const response = await api.get<{ success: boolean; users: StudentUser[] }>(
      USERS_BASE, 
      {
        params: {
          role: 'student', 
          ...params
        }
      }
    );
    return response.data;
  },

  // GET /users/:id
  getUserById: async (id: string) => {
    const response = await api.get<{ success: boolean; user: User }>(`${USERS_BASE}/${id}`);
    return response.data;
  },

  // ==========================================
  // 2. ADMIN MANAGEMENT ROUTES (Base: /admin)
  // ==========================================

  // POST /admin/users/student (Create Student)
  // Note: If you have a specific admin route for creation, change prefix to ADMIN_BASE. 
  // Keeping USERS_BASE here based on standard REST patterns, but update if your backend moved it.
  createStudent: async (data: CreateStudentPayload) => {
    const response = await api.post<{ success: boolean; user: User; message: string }>(
      `${USERS_BASE}/student`, 
      data
    );
    return response.data;
  },

// PUT /admin/users/:id/profile (Admin updates profile with image & address)
  updateUserProfileByAdmin: async (
    id: string, 
    data: { 
        firstName: string; 
        lastName: string; 
        phoneNumber: string; 
        address?: { street: string; city: string; state: string; zipCode: string } | string;
        profileImage?: File | null;
    }
  ) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("phoneNumber", data.phoneNumber);

    // Fix: Serialize Address Object to JSON String for FormData
    if (data.address) {
        const addressValue = typeof data.address === 'object' 
            ? JSON.stringify(data.address) 
            : data.address;
        formData.append("address", addressValue);
    }

    // Fix: Handle Profile Image
    if (data.profileImage) {
        formData.append("profileImage", data.profileImage);
    }

    const response = await api.put<{ success: boolean; user: User }>(
        `${ADMIN_BASE}/users/${id}/profile`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  // PUT /admin/users/:id (General Details Update)
  updateUser: async (id: string, data: AdminUpdatePayload) => {
    // Note: If your general update route is also moved to admin router, change to ADMIN_BASE
    const response = await api.put<{ success: boolean; user: User }>(
      `${USERS_BASE}/${id}`, 
      data
    );
    return response.data;
  },

  // PUT /admin/users/:id/email
  updateUserEmailByAdmin: async (id: string, email: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
        `${ADMIN_BASE}/users/${id}/email`,
        { email }
    );
    return response.data;
  },

  // PUT /admin/users/:id/password
  updateUserPasswordByAdmin: async (id: string, password: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
        `${ADMIN_BASE}/users/${id}/password`,
        { password, confirmPassword: password }
    );
    return response.data;
  },

  // --- STATUS MANAGEMENT ---

  lockUser: async (id: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${ADMIN_BASE}/users/${id}/lock`
    );
    return response.data;
  },

  unlockUser: async (id: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${ADMIN_BASE}/users/${id}/unlock`
    );
    return response.data;
  },

  activateUser: async (id: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${ADMIN_BASE}/users/${id}/activate`
    );
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${ADMIN_BASE}/users/${id}/deactivate`
    );
    return response.data;
  },

  // --- DELETION & RESTORE ---
  
  deleteUser: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${ADMIN_BASE}/users/${id}`
    );
    return response.data;
  },

  restoreUser: async (id: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${ADMIN_BASE}/users/${id}/restore`
    );
    return response.data;
  },

  // ==========================================
  // 3. SELF-SERVICE (User manages own profile)
  // ==========================================

  updateUserProfile: async (data: UpdateProfilePayload) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
    if (data.profileImage) formData.append("profileImage", data.profileImage);

    const response = await api.put<{ success: boolean; user: User }>(
      `${USERS_BASE}/profile`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  updateUserEmail: async (email: string) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${USERS_BASE}/email`,
      { email }
    );
    return response.data;
  },

  updateUserPassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<{ success: boolean; message: string }>(
      `${USERS_BASE}/password`,
      payload
    );
    return response.data;
  },

  deleteUserAccount: async () => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${USERS_BASE}/delete-account`
    );
    return response.data;
  },

  // ==========================================
  // 4. AUTH / RECOVERY
  // ==========================================

  forgetUserPassword: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(`${AUTH_BASE}/forget-password`, { email });
    return response.data;
  },

  resetUserPassword: async (payload: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<{ success: boolean; message: string }>(`${AUTH_BASE}/reset-password`, payload);
    return response.data;
  },

  verifyUserEmail: async (payload: { email: string; otpCode: string }) => {
    const response = await api.post<{ success: boolean; user?: User; message: string }>(`${AUTH_BASE}/verify-email`, payload);
    return response.data;
  },

  resendVerificationOtp: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>(`${AUTH_BASE}/resend-otp`, { email });
    return response.data;
  },
};

export default UserService;