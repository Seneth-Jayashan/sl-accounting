import api from "./api";

// --- INTERFACES ---

export interface SessionData {
  _id: string;
  class: string; // Class ID
  index: number;
  startAt: string; // ISO Date string
  endAt: string;   // ISO Date string
  timezone: string;
  title?: string;
  notes?: string;
  materials?: string[];
  
  // Zoom Details
  zoomMeetingId?: string;
  zoomJoinUrl?: string;     // Safe for students
  zoomStartUrl?: string;    // DANGER: Admin/Instructor ONLY. Backend must filter this.
  
  // Recordings
  youtubeVideoId?: string; 
  recordingUrl?: string;    // Added for frontend compatibility

  // Status
  isCancelled: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionPayload {
  // Preferred: Full ISO string to prevent timezone ambiguity
  startAt: string; 
  durationMinutes: number;
  
  timezone?: string;
  title?: string;
  notes?: string;
  skipZoom?: boolean;
  materials?: string[];
  
  // Optional Legacy support (Backend handles logic)
  date?: string; 
  time?: string; 
}

export interface UpdateSessionPayload extends Partial<CreateSessionPayload> {
  isCancelled?: boolean;
  cancellationReason?: string; // Standardized name
  abortOnZoomFail?: boolean;
  youtubeVideoId?: string;
  recordingUrl?: string;
}

export interface SessionFilterParams {
  classId?: string;
  from?: string; // ISO Date
  to?: string;   // ISO Date
  isCancelled?: boolean;
  page?: number;
  limit?: number;
  sort?: string; // e.g. "startAt" or "-startAt"
}

// Standardized API Response Wrapper
export interface SessionResponse {
  success: boolean;
  message?: string;
  session?: SessionData;
  sessions?: SessionData[]; // Used if backend returns list inside wrapper
}

// --- SERVICE DEFINITION ---

const BASE_URL = "/sessions";

const SessionService = {
  /**
   * Get all sessions with filters
   * Endpoint: GET /api/v1/sessions
   */
  getAllSessions: async (params: SessionFilterParams = {}) => {
    // Note: If backend returns raw array, keep as SessionData[]. 
    // If it returns { success: true, data: [...] }, change to SessionResponse.
    const response = await api.get<SessionData[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get sessions by Class ID
   * Endpoint: GET /api/v1/sessions?classId=...
   */
  getSessionsByClassId: async (classId: string) => {
    const response = await api.get<SessionData[]>(BASE_URL, {
        params: { classId } 
    });
    return response.data;
  },

  /**
   * Get single session details
   * Endpoint: GET /api/v1/sessions/:id
   */
  getSessionById: async (sessionId: string) => {
    const response = await api.get<SessionData>(`${BASE_URL}/${sessionId}`);
    return response.data;
  },

  /**
   * Create a new session
   * Endpoint: POST /api/v1/sessions/class/:classId
   */
  createSession: async (classId: string, data: CreateSessionPayload) => {
    const response = await api.post<SessionResponse>(`${BASE_URL}/class/${classId}`, data);
    return response.data;
  },

  /**
   * Update session details
   * Endpoint: PUT /api/v1/sessions/:id
   */
  updateSession: async (id: string, data: UpdateSessionPayload) => {
    const response = await api.put<SessionResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Cancel a session (Soft Delete)
   * Endpoint: POST /api/v1/sessions/:id/cancel
   */
  cancelSession: async (id: string, reason?: string, deleteZoom: boolean = true) => {
    const payload = { 
      cancellationReason: reason || "No reason provided", 
      deleteZoomMeeting: deleteZoom 
    };
    const response = await api.post<SessionResponse>(`${BASE_URL}/${id}/cancel`, payload);
    return response.data;
  },

  /**
   * Permanently Delete a session
   * Endpoint: DELETE /api/v1/sessions/:id
   */
  deleteSession: async (id: string) => {
    const response = await api.delete<SessionResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default SessionService;