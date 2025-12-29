import { api } from "./api"; 

// --- CONFIGURATION ---
const USERS_BASE = "/users"; // Public/Shared endpoints
const AUTH_BASE = "/auth";   // Auth endpoints

// --- TYPES ---

// Base User Interface
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin';
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
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

// --- NEW DASHBOARD TYPES ---

export interface DashboardStats {
  activeClasses: number;
  pendingPaymentsCount: number;
  attendancePercentage: number;
}

export interface NextSessionData {
  title: string;
  subject: string;
  startTime: string; // ISO String
}

export interface NextPaymentData {
  amount: number;
  dueDate: string;
  title: string;
}

export interface UpcomingSession {
  _id: string;
  title: string;
  startTime: string;
  subject?: string;
  isOnline: boolean;
}

export interface RecentMaterial {
  _id: string;
  title: string;
  fileType: "pdf" | "video" | "link";
  fileUrl: string;
  createdAt: string;
}

export interface StudentDashboardData {
  stats: DashboardStats;
  nextSession: NextSessionData | null;
  nextPayment: NextPaymentData | null;
  upcomingSessions: UpcomingSession[];
  recentMaterials: RecentMaterial[];
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
  createStudent: async (data: CreateStudentPayload) => {
    const response = await api.post<{ success: boolean; user: User; message: string }>(
      `${USERS_BASE}/student`, 
      data
    );
    return response.data;
  },



  // PUT /admin/users/:id (General Details Update)
  updateUser: async (id: string, data: AdminUpdatePayload) => {
    const response = await api.put<{ success: boolean; user: User }>(
      `${USERS_BASE}/${id}`, 
      data
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
    if (data.address) {
        const addressValue = typeof data.address === 'object' 
            ? JSON.stringify(data.address) 
            : data.address;
        formData.append("address", addressValue);
    }

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
  // 4. STUDENT DASHBOARD
  // ==========================================

  getStudentDashboard: async () => {
    const response = await api.get<{ success: boolean; data: StudentDashboardData }>(`${USERS_BASE}/student/dashboard`);
    return response.data.data;
  },

  // ==========================================
  // 5. AUTH / RECOVERY
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