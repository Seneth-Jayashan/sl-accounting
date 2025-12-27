import { api } from "./api";

// --- Types ---

export interface DashboardStats {
  totalStudents: number;
  totalRevenue: number;
  activeClasses: number;
  studentGrowth: number; // Percentage
  revenueGrowth: number; // Percentage
}

export interface ActivityLog {
  _id: string;
  action: string; // e.g., "New student registered"
  targetName?: string; // e.g., "Tharindu"
  type: "student" | "class" | "payment" | "material";
  createdAt: string;
}

export interface TopStudent {
  _id: string;
  firstName: string;
  lastName: string;
  batch: string;
  averageScore: number; // 0-100
}

export interface UpcomingClass {
  _id: string;
  name: string;
  subject: string;
  startTime: string; // ISO String
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityLog[];
  topStudents: TopStudent[];
  nextClass: UpcomingClass | null;
}

// --- Service ---

const DashboardService = {
  getDashboardSummary: async (): Promise<DashboardData> => {
    // Ideally, your backend should have one endpoint that aggregates this data
    // to reduce network requests (e.g., GET /admin/dashboard/summary)
    const response = await api.get<DashboardData>("/admin/dashboard/summary");
    return response.data;
  },
};

export default DashboardService;