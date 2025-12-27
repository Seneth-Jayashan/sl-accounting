import { api } from "./api";

// --- TYPES ---
const BASE_URL = "/announcements";

export interface AnnouncementData {
  _id: string;
  title: string;
  content: string;
  class: string; // The ID of the class
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  classDetails?: any; // Populated virtual field
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  classId: string;
  isPublished?: boolean;
}

export type UpdateAnnouncementPayload = Partial<Omit<CreateAnnouncementPayload, 'classId'>>;

interface AnnouncementResponse {
  success: boolean;
  message?: string;
  data?: AnnouncementData | AnnouncementData[];
  count?: number;
  isPublished?: boolean;
}

// --- SERVICE ---

const AnnouncementService = {
  // --- ADMIN ACTIONS ---

  /**
   * Create a new announcement for a specific class
   */
  createAnnouncement: async (payload: CreateAnnouncementPayload) => {
    const response = await api.post<AnnouncementResponse>(BASE_URL, payload);
    return response.data;
  },

  /**
   * Get all announcements (Admin view, can filter by classId via query)
   */
  getAllAnnouncements: async (classId?: string) => {
    const url = classId ? `${BASE_URL}?classId=${classId}` : BASE_URL;
    const response = await api.get<AnnouncementResponse>(url);
    return response.data;
  },

  /**
   * Update announcement details (Title or Content)
   */
  updateAnnouncement: async (id: string, data: UpdateAnnouncementPayload) => {
    const response = await api.put<AnnouncementResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Toggle the isPublished status (Visibility)
   */
  toggleVisibility: async (id: string) => {
    const response = await api.patch<AnnouncementResponse>(`${BASE_URL}/${id}/visibility`);
    return response.data;
  },

  /**
   * Permanently delete an announcement
   */
  deleteAnnouncement: async (id: string) => {
    const response = await api.delete<AnnouncementResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // --- STUDENT ACTIONS ---

  /**
   * Fetch announcements for the student's specific class
   * Note: This uses POST as requested because classId is sent in req.body
   */
  getStudentAnnouncements: async (classId: string) => {
    const response = await api.post<AnnouncementResponse>(`${BASE_URL}/view-class`, { 
      classId 
    });
    return response.data;
  },
};

export default AnnouncementService;