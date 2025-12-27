import api from "./api";

// --- INTERFACES ---

export interface SessionData {
  _id: string;
  class: string;
  index: number;
  startAt: string;
  endAt: string;
  timezone: string;
  title?: string;
  notes?: string;
  materials?: string[];
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string; // SENSITIVE: Admin only
  youtubeVideoId?: string;
  recordingUrl?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionPayload {
  startAt: string | Date;
  durationMinutes: number;
  timezone?: string;
  title?: string;
  notes?: string;
  skipZoom?: boolean;
  materials?: string[];
}

export interface SessionFilterParams {
  classId?: string;
  from?: string;
  to?: string;
  isCancelled?: boolean;
  page?: number;
  limit?: number;
}

// Internal Wrapper for API responses
interface SessionResponse {
  success: boolean;
  message?: string;
  session?: SessionData;
  sessions?: SessionData[];
}

const BASE_URL = "/sessions";

/**
 * Helper to extract data regardless of whether the API wraps it in a 
 * { success, sessions: [] } object or returns the array directly.
 */
const unwrap = <T>(response: any, key: string): T => {
  return response.data?.[key] || response.data || [];
};

const SessionService = {
  /**
   * Fetch all sessions with filtering
   * Returns SessionData[] directly for easier component usage
   */
  getAllSessions: async (params: SessionFilterParams = {}): Promise<SessionData[]> => {
    const response = await api.get<any>(BASE_URL, { params });
    return unwrap<SessionData[]>(response, "sessions");
  },

  /**
   * Fetch sessions for a specific class
   */
  getSessionsByClassId: async (classId: string): Promise<SessionData[]> => {
    const response = await api.get<any>(BASE_URL, { params: { classId } });
    return unwrap<SessionData[]>(response, "sessions");
  },

  /**
   * Fetch single session details
   */
  getSessionById: async (sessionId: string): Promise<SessionData | null> => {
    const response = await api.get<any>(`${BASE_URL}/${sessionId}`);
    return response.data?.session || response.data || null;
  },

  /**
   * Create a new session for a specific class
   */
  createSession: async (classId: string, data: CreateSessionPayload) => {
    const payload = {
      ...data,
      startAt: data.startAt instanceof Date ? data.startAt.toISOString() : data.startAt,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    const response = await api.post<SessionResponse>(`${BASE_URL}/class/${classId}`, payload);
    return response.data;
  },

  /**
   * Update an existing session (Use PATCH for partial updates)
   */
  updateSession: async (id: string, data: Partial<SessionData>) => {
    const response = await api.patch<SessionResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Cancel a session (Logic/Soft Delete)
   */
  cancelSession: async (id: string, reason: string = "Admin Cancelled", deleteZoom: boolean = true) => {
    const response = await api.post<SessionResponse>(`${BASE_URL}/${id}/cancel`, {
      cancellationReason: reason,
      deleteZoomMeeting: deleteZoom
    });
    return response.data;
  },

  /**
   * Hard delete a session
   */
  deleteSession: async (id: string) => {
    const response = await api.delete<SessionResponse>(`${BASE_URL}/${id}`);
    return response.data;
  }
};

export default SessionService;