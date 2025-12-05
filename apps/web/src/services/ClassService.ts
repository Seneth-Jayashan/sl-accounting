import { api } from "./api";

// ⚠️ NOTE: Ensure your backend has a route mounted at /classes
const BASE_URL = "/classes"; 

export interface CreateClassPayload {
  className: string;
  subject: string;
  batch: string;
  fee: string;
  description?: string;
  scheduleDay?: string; // e.g. "Monday"
  scheduleTime?: string; // e.g. "08:30 AM"
  coverImage?: File | null;
}

const ClassService = {
  // POST /classes
  createClass: async (data: CreateClassPayload) => {
    const formData = new FormData();
    formData.append("className", data.className);
    formData.append("subject", data.subject);
    formData.append("batch", data.batch);
    formData.append("fee", data.fee);
    
    if (data.description) formData.append("description", data.description);
    if (data.scheduleDay) formData.append("scheduleDay", data.scheduleDay);
    if (data.scheduleTime) formData.append("scheduleTime", data.scheduleTime);
    
    if (data.coverImage) {
      formData.append("coverImage", data.coverImage);
    }

    const response = await api.post<{ success: boolean; message: string; class: any }>(
      BASE_URL,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // GET /classes
  getAllClasses: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  // GET /classes/:id  <-- NEW
  getClassById: async (id: string) => {
    const response = await api.get<{ success: boolean; class: any }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // DELETE /classes/:id <-- NEW
  deleteClass: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // PUT /classes/:id
  updateClass: async (id: string, data: Partial<CreateClassPayload>) => {
    const formData = new FormData();
    
    // Append fields only if they are present
    if (data.className) formData.append("className", data.className);
    if (data.subject) formData.append("subject", data.subject);
    if (data.batch) formData.append("batch", data.batch);
    if (data.fee) formData.append("fee", data.fee);
    if (data.description) formData.append("description", data.description);
    if (data.scheduleDay) formData.append("scheduleDay", data.scheduleDay);
    if (data.scheduleTime) formData.append("scheduleTime", data.scheduleTime);
    
    // Only append image if a new file is selected
    if (data.coverImage) {
      formData.append("coverImage", data.coverImage);
    }

    const response = await api.put<{ success: boolean; message: string; class: any }>(
      `${BASE_URL}/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },
};

export default ClassService;