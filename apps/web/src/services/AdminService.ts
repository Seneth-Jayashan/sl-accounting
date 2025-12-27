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
  profileImage?: string;
  createdAt: string;
  // FIX: Allow address to be string OR object
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  // FIX: Add missing academic fields
  regNo?: string;
  batch?: string;
}

export interface UserListResponse {
  success: boolean;
  users: UserData[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
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
    const response = await api.get<{ success: boolean; user: UserData }>(`${BASE_URL}/users/${id}`);
    return response.data.user;
  },

  createUser: async (data: Partial<UserData> & { password?: string }) => {
    // We allow any partial user data + password
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