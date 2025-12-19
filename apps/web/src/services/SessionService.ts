import api from "./api"; // Your configured axios instance

// --- Interfaces ---

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
  zoomMeetingId?: string;
  zoomStartUrl?: string; // Only visible to instructors/admin
  zoomJoinUrl?: string;
  recordingUrl?: string; // Added recordingUrl as it's used in the frontend
  isCancelled: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionPayload {
  // Option A: ISO String
  startAt?: string; 
  // Option B: Date + Time parts
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  timezone?: string;

  durationMinutes?: number;
  title?: string;
  notes?: string;
  skipZoom?: boolean;
  materials?: string[];
}

export interface UpdateSessionPayload extends Partial<CreateSessionPayload> {
  isCancelled?: boolean;
  cancelReason?: string;
  abortOnZoomFail?: boolean;
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

export interface SessionResponse {
  message?: string;
  session?: SessionData;
  // Based on your controller, GET requests return SessionData[] directly
  // POST/PUT requests return an object with message/session
  error?: string;
}

// --- Service Definition ---

const BASE_URL = "/sessions";

const SessionService = {
  /**
   * Get all sessions with optional filters (date range, class, etc.)
   * Endpoint: GET /api/v1/sessions
   */
  getAllSessions: async (params: SessionFilterParams = {}) => {
    // Backend returns SessionData[] directly
    const response = await api.get<SessionData[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get all sessions specific to a class (Convenience wrapper for getAllSessions)
   * Endpoint: GET /api/v1/sessions?classId=...
   */
  getSessionsByClassId: async (classId: string) => {
    // FIX: Changed param 'class' to 'classId' to match backend route
    const response = await api.get<SessionData[]>(BASE_URL, {
        params: { classId: classId } 
    });
    return response.data;
  },

  /**
   * Create a new custom session for a specific class
   * Endpoint: POST /api/v1/sessions/class/:classId
   */
  createSession: async (classId: string, data: CreateSessionPayload) => {
    const response = await api.post<SessionResponse>(`${BASE_URL}/class/${classId}`, data);
    return response.data;
  },

  /**
   * Update an existing session
   * Endpoint: PUT /api/v1/sessions/:id
   */
  updateSession: async (id: string, data: UpdateSessionPayload) => {
    const response = await api.put<SessionResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Cancel a session (Soft Delete / Status Change)
   * Endpoint: POST /api/v1/sessions/:id/cancel
   */
  cancelSession: async (id: string, reason?: string, deleteZoom: boolean = true) => {
    const payload = { 
      cancellationReason: reason, 
      deleteZoomMeeting: deleteZoom 
    };
    const response = await api.post<SessionResponse>(`${BASE_URL}/${id}/cancel`, payload);
    return response.data;
  },

  /**
   * Hard Delete a session
   * Endpoint: DELETE /api/v1/sessions/:id
   */
  deleteSession: async (id: string) => {
    const response = await api.delete<SessionResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default SessionService;