import { api } from "./api";

const BASE_URL = "/admin";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalRevenue: number;
    activeClasses: number;
    studentGrowth: number;
    revenueGrowth: number;
  };
  recentActivity: Array<{
    _id: string;
    action: string;
    targetName: string;
    type: string;
    createdAt: string;
  }>;
  topStudents: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    batch: string;
    totalPaid: number;
  }>;
  nextClass: {
    _id: string;
    name: string;
    subject: string;
    startTime: string;
  } | null;
}

export interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: "admin" | "student" | "instructor";
  isActive: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  isVerified: boolean;
  profileImage?: string;
  createdAt: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  regNo?: string;
  batch?: string;
  lastLogin?: string;
}

export interface UserListResponse {
  success: boolean;
  users: UserData[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

export interface AdminStudentEnrollment {
  _id: string;
  class?: {
    _id: string;
    name: string;
    coverImage?: string;
    price?: number;
    type?: string;
    level?: string;
  } | string;
  paymentStatus: string;
  isActive: boolean;
  accessStartDate?: string;
  accessEndDate?: string;
  paidMonths?: string[];
  createdAt: string;
}

export interface AdminStudentPayment {
  _id: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  paymentDate?: string;
  targetMonth?: string;
  transactionId?: string;
  notes?: string;
  enrollment?: {
    _id: string;
    class?: {
      _id: string;
      name: string;
      coverImage?: string;
      type?: string;
    };
  };
}

export interface AdminStudentPaidClassSummary {
  class: {
    _id: string;
    name: string;
    coverImage?: string | null;
    type?: string | null;
    level?: string | null;
    price?: number;
  };
  totalPaidAmount: number;
  paymentCount: number;
  paidMonths: string[];
  lastPaidAt?: string;
}

export interface AdminStudentProfileResponse {
  success: boolean;
  user: UserData;
  enrollments: AdminStudentEnrollment[];
  payments: AdminStudentPayment[];
  lifetimePaidClasses: AdminStudentPaidClassSummary[];
  stats: {
    totalEnrollments: number;
    activeEnrollments: number;
    totalPayments: number;
    completedPayments: number;
    lifetimePaidAmount: number;
    totalPaidClasses: number;
  };
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  batch?: string;
  isDeleted?: boolean;
  isLocked?: boolean;
}

// ==========================================
// 2. ADMIN SERVICE
// ==========================================

const AdminService = {
  
  // --- DASHBOARD ---
  
  getDashboardSummary: async () => {
    const response = await api.get<{ success: boolean; stats: any; recentActivity: any; topStudents: any; nextClass: any }>(`${BASE_URL}/dashboard/summary`);
    // Return the whole data object directly for easier destruction
    return {
      stats: response.data.stats,
      recentActivity: response.data.recentActivity,
      topStudents: response.data.topStudents,
      nextClass: response.data.nextClass
    } as AdminDashboardData;
  },

  // --- USER MANAGEMENT (CRUD) ---

  getAllUsers: async (params: UserQueryParams = {}) => {
    const response = await api.get<UserListResponse>(`${BASE_URL}/users`, { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get<AdminStudentProfileResponse>(`${BASE_URL}/users/${id}`);
    return response.data;
  },

  createUser: async (data: Partial<UserData> & { password?: string }) => {
    const response = await api.post<{ success: boolean; user: UserData }>(`${BASE_URL}/users`, data);
    return response.data.user;
  },

  // --- PROFILE UPDATES ---

  updateUserProfile: async (id: string, formData: FormData) => {
    // Note: We use FormData here because it might contain an image file
    const response = await api.put<{ success: boolean; user: UserData }>(
      `${BASE_URL}/users/${id}/profile`, 
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.user;
  },

  updateUserEmail: async (id: string, email: string) => {
    const response = await api.put(`${BASE_URL}/users/${id}/email`, { email });
    return response.data;
  },

  updateUserPassword: async (id: string, newPassword: string) => {
    const response = await api.put(`${BASE_URL}/users/${id}/password`, { newPassword });
    return response.data;
  },

  // --- ACCOUNT STATUS ACTIONS ---

  lockUser: async (id: string) => {
    const response = await api.patch(`${BASE_URL}/users/${id}/lock`);
    return response.data;
  },

  unlockUser: async (id: string) => {
    const response = await api.patch(`${BASE_URL}/users/${id}/unlock`);
    return response.data;
  },

  activateUser: async (id: string) => {
    const response = await api.patch(`${BASE_URL}/users/${id}/activate`);
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await api.patch(`${BASE_URL}/users/${id}/deactivate`);
    return response.data;
  },

  // --- DELETION & RESTORE ---

  deleteUser: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/users/${id}`);
    return response.data;
  },

  restoreUser: async (id: string) => {
    const response = await api.patch(`${BASE_URL}/users/${id}/restore`);
    return response.data;
  },
};

export default AdminService;