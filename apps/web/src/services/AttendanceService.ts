import api from "./api";

// --- INTERFACES ---
export interface SessionAttendanceResponse {
  sessionId: string;
  count?: number;
  attendance: any[];
}

export interface ClassAttendanceSummary {
  totalSessions: number;
  sessionSummary: any[];
}

export interface MyAttendanceRecord {
  sessionId: string;
  index: number;
  startAt: string;
  endAt: string;
  title?: string;
  isPresent: boolean;
}

const BASE_URL = "/attendance";

const AttendanceService = {
  /**
   * Fetch attendance records for a specific session
   */
  getSessionAttendance: async (sessionId: string): Promise<SessionAttendanceResponse> => {
    const response = await api.get<SessionAttendanceResponse>(`${BASE_URL}/${sessionId}`);
    return response.data;
  },

  /**
   * Fetch attendance summary for all sessions in a class (Admin Only)
   */
  getClassAttendanceSummary: async (classId: string): Promise<ClassAttendanceSummary> => {
    const response = await api.get<ClassAttendanceSummary>(`${BASE_URL}/class/${classId}/summary`);
    return response.data;
  },

  /**
   * Fetch attendance history for the logged in student
   */
  getMyClassAttendance: async (classId: string): Promise<MyAttendanceRecord[]> => {
    const response = await api.get<MyAttendanceRecord[]>(`${BASE_URL}/class/${classId}/my-attendance`);
    return response.data;
  },

  /**
   * Manually mark attendance start for a student (Admin/Instructor Only) or Auto-mark for student
   */
  markAttendanceStart: async (sessionId: string, studentId: string) => {
    const response = await api.post(`${BASE_URL}/start`, {
      sessionId,
      studentId
    });
    return response.data;
  },

  /**
   * Manually mark attendance end for a student
   */
  markAttendanceEnd: async (sessionId: string, studentId: string) => {
    const response = await api.post(`${BASE_URL}/end`, {
      sessionId,
      studentId
    });
    return response.data;
  },

  /**
   * Clear all attendance for a session (Admin/Instructor Only)
   */
  clearSessionAttendance: async (sessionId: string) => {
    const response = await api.delete(`${BASE_URL}/${sessionId}/clear`);
    return response.data;
  }
};

export default AttendanceService;
