// services/ClassService.ts
import { api } from "./api";

const BASE_URL = "/classes";

export interface SchedulePayload {
  day: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  timezone?: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  price?: number | string;
  batch?: string | null; // 24-char ObjectId string (Zod schema expects 'batch')
  timeSchedules?: SchedulePayload[];
  firstSessionDate?: string; // ISO string
  recurrence?: "weekly" | "daily" | "none";
  totalSessions?: number;
  sessionDurationMinutes?: number;
  level?: "general" | "ordinary" | "advanced";
  tags?: string[];
  isPublished?: boolean;
  coverImage?: File | null;
  images?: File[] | null;
}

export type UpdateClassPayload = Partial<CreateClassPayload>;

const ClassService = {
  // Create (multipart/form-data) — do NOT set Content-Type header manually
  createClass: async (data: CreateClassPayload) => {
    const formData = new FormData();

    formData.append("name", String(data.name));
    if (data.description) formData.append("description", String(data.description));
    if (data.price !== undefined) formData.append("price", String(data.price));
    if (data.batch) {
      // primary correct field name (Zod / new API)
      formData.append("batch", String(data.batch));
      // compatibility: also append 'bacth' for older backend expecting the typo
      formData.append("bacth", String(data.batch));
    }
    if (data.firstSessionDate) formData.append("firstSessionDate", String(data.firstSessionDate));
    if (data.recurrence) formData.append("recurrence", data.recurrence);
    if (data.totalSessions !== undefined) formData.append("totalSessions", String(data.totalSessions));
    if (data.sessionDurationMinutes !== undefined)
      formData.append("sessionDurationMinutes", String(data.sessionDurationMinutes));
    if (data.level) formData.append("level", data.level);
    if (data.tags && Array.isArray(data.tags)) formData.append("tags", JSON.stringify(data.tags));
    if (data.timeSchedules && Array.isArray(data.timeSchedules))
      formData.append("timeSchedules", JSON.stringify(data.timeSchedules));
    if (data.isPublished !== undefined) formData.append("isPublished", String(Boolean(data.isPublished)));

    if (data.coverImage) {
      formData.append("coverImage", data.coverImage, data.coverImage.name);
    }
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((file, idx) => {
        formData.append("images", file, file.name || `image-${idx}`);
      });
    }

    // Important: do NOT set Content-Type manually.
    const response = await api.post<{ success: boolean; message?: string; class?: any }>(
      BASE_URL,
      formData
    );
    return response.data;
  },

  // GET all
  getAllClasses: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  // GET by id
  getClassById: async (id: string) => {
    const response = await api.get<{ success: boolean; class?: any }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // GET all public classes
  getAllPublicClasses: async () => {
    const response = await api.get(`${BASE_URL}/public`);
    return response.data;
  },

    // GET all public classes
  getPublicClassById: async (id: string) => {
    // This hits: http://localhost:3000/api/v1/classes/public/:id
    const response = await api.get(`${BASE_URL}/public/${id}`);
    return response.data;
  },

  // DELETE
  deleteClass: async (id: string) => {
    const response = await api.delete<{ success: boolean; message?: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // PUT update (handles JSON or FormData depending on presence of files)
  updateClass: async (id: string, data: UpdateClassPayload) => {
    const hasFile = !!(data.coverImage || (data.images && data.images.length));
    if (hasFile) {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description) formData.append("description", String(data.description));
      if (data.price !== undefined) formData.append("price", String(data.price));
      if (data.batch) { formData.append("batch", String(data.batch)); formData.append("bacth", String(data.batch)); }
      if (data.firstSessionDate) formData.append("firstSessionDate", String(data.firstSessionDate));
      if (data.recurrence) formData.append("recurrence", data.recurrence);
      if (data.totalSessions !== undefined) formData.append("totalSessions", String(data.totalSessions));
      if (data.sessionDurationMinutes !== undefined) formData.append("sessionDurationMinutes", String(data.sessionDurationMinutes));
      if (data.level) formData.append("level", data.level);
      if (data.tags && Array.isArray(data.tags)) formData.append("tags", JSON.stringify(data.tags));
      if (data.timeSchedules && Array.isArray(data.timeSchedules)) formData.append("timeSchedules", JSON.stringify(data.timeSchedules));
      if (data.isPublished !== undefined) formData.append("isPublished", String(Boolean(data.isPublished)));

      if (data.coverImage) formData.append("coverImage", data.coverImage, data.coverImage.name);
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((file, idx) => formData.append("images", file, file.name || `image-${idx}`));
      }

      const response = await api.patch(`${BASE_URL}/${id}`, formData);
      return response.data;
    } else {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.price !== undefined) payload.price = data.price;
      if (data.batch !== undefined) { payload.batch = data.batch; payload.bacth = data.batch; }
      if (data.firstSessionDate !== undefined) payload.firstSessionDate = data.firstSessionDate;
      if (data.recurrence !== undefined) payload.recurrence = data.recurrence;
      if (data.totalSessions !== undefined) payload.totalSessions = data.totalSessions;
      if (data.sessionDurationMinutes !== undefined) payload.sessionDurationMinutes = data.sessionDurationMinutes;
      if (data.level !== undefined) payload.level = data.level;
      if (data.tags !== undefined) payload.tags = data.tags;
      if (data.timeSchedules !== undefined) payload.timeSchedules = data.timeSchedules;
      if (data.isPublished !== undefined) payload.isPublished = Boolean(data.isPublished);

      const response = await api.patch(`${BASE_URL}/${id}`, payload);
      return response.data;
    }
  },

  // quick PATCH helpers
  setActive: async (id: string, active: boolean) => {
    const response = await api.patch(`${BASE_URL}/${id}`, { isActive: active });
    return response.data;
  },

  setPublished: async (id: string, published: boolean) => {
    const response = await api.patch(`${BASE_URL}/${id}`, { isPublished: published });
    return response.data;
  },
};

export default ClassService;
