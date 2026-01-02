import { api } from "./api";

// --- TYPES ---
const BASE_URL = "/classes";

export interface SchedulePayload {
  day: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  timezone?: string;
}

export interface EnrolledStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic?: string;
  phoneNumber?: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  price?: number; // kept strict as number
  batch?: string; // ObjectId string
  timeSchedules?: SchedulePayload[];
  firstSessionDate?: string; // ISO string
  recurrence?: "weekly" | "daily" | "none";
  totalSessions?: number;
  sessionDurationMinutes?: number;
  level?: "general" | "ordinary" | "advanced";
  type?: "theory" | "revision" | "paper";
  tags?: string[];
  isPublished?: boolean;
  // File objects
  coverImage?: File | null;
  images?: File[] | null;
  autoCreateVariants?: boolean;
  revisionDay?: number;
  revisionStartTime?: string;
  revisionEndTime?: string;
  revisionPrice?: number; 
  paperDay?: number;
  paperStartTime?: string;
  paperEndTime?: string;
  paperPrice?: number;
}

export type UpdateClassPayload = Partial<CreateClassPayload>;

// Response Type (prevents using 'any')
export interface ClassData {
  _id: string;
  name: string;
  description: string;
  price: number;
  batch: string | any; // Depending on if your backend populates it
  type: "theory" | "revision" | "paper";
  coverImage?: string;
  images: string[];
  isPublished: boolean;
  students?: EnrolledStudent[];
  // ... add other fields returned by backend
}



interface ClassResponse {
  success: boolean;
  message?: string;
  class?: ClassData;
  classes?: ClassData[];
}

// --- HELPER: FormData Builder ---
// Centralizes logic to prevent code duplication
const buildClassFormData = (data: UpdateClassPayload): FormData => {
  const formData = new FormData();

  // Text Fields
  if (data.name) formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.price !== undefined) formData.append("price", String(data.price));
  if (data.batch) formData.append("batch", data.batch); // Removed "bacth" typo
  if (data.firstSessionDate) formData.append("firstSessionDate", data.firstSessionDate);
  if (data.recurrence) formData.append("recurrence", data.recurrence);
  if (data.type) formData.append("type", data.type);
  if (data.totalSessions !== undefined) formData.append("totalSessions", String(data.totalSessions));
  if (data.sessionDurationMinutes !== undefined) formData.append("sessionDurationMinutes", String(data.sessionDurationMinutes));
  if (data.level) formData.append("level", data.level);
  if (data.isPublished !== undefined) formData.append("isPublished", String(Boolean(data.isPublished)));

  // Array Fields (Must be stringified for FormData)
  if (data.tags && Array.isArray(data.tags)) {
    formData.append("tags", JSON.stringify(data.tags));
  }
  if (data.timeSchedules && Array.isArray(data.timeSchedules)) {
    formData.append("timeSchedules", JSON.stringify(data.timeSchedules));
  }

  // File Fields
  if (data.coverImage) {
    formData.append("coverImage", data.coverImage);
  }
  
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    data.images.forEach((file) => {
      formData.append("images", file); 
    });
  }

  if (data.autoCreateVariants !== undefined) formData.append("autoCreateVariants", String(data.autoCreateVariants));
  if (data.revisionDay !== undefined) formData.append("revisionDay", String(data.revisionDay));
  if (data.revisionStartTime) formData.append("revisionStartTime", data.revisionStartTime);
  if (data.revisionEndTime) formData.append("revisionEndTime", data.revisionEndTime);
  if (data.revisionPrice !== undefined) formData.append("revisionPrice", String(data.revisionPrice));
  if (data.paperDay !== undefined) formData.append("paperDay", String(data.paperDay));
  if (data.paperStartTime) formData.append("paperStartTime", data.paperStartTime);
  if (data.paperEndTime) formData.append("paperEndTime", data.paperEndTime);
  if (data.paperPrice !== undefined) formData.append("paperPrice", String(data.paperPrice));

  return formData;
};

// --- SERVICE ---

const ClassService = {
  // CREATE
  createClass: async (data: CreateClassPayload) => {
    const formData = buildClassFormData(data);
    
    const response = await api.post<ClassResponse>(BASE_URL, formData,
      {
        headers: {
          "Content-Type": "multipart/form-data" 
        }
      }
    );
    return response.data;
  },

  // READ
  getAllClasses: async () => {
    const response = await api.get<ClassResponse>(BASE_URL);
    return response.data;
  },

  getClassById: async (id: string) => {
    const response = await api.get<ClassResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getAllPublicClasses: async () => {
    const response = await api.get<ClassResponse>(`${BASE_URL}/public`);
    return response.data;
  },

  getPublicClassById: async (id: string) => {
    const response = await api.get<ClassResponse>(`${BASE_URL}/public/${id}`);
    return response.data;
  },

  // UPDATE
  updateClass: async (id: string, data: UpdateClassPayload) => {
    // Check if we need Multipart (Files exist) or Standard JSON
    const hasFiles = !!(data.coverImage || (data.images && data.images.length));

    if (hasFiles) {
      const formData = buildClassFormData(data);

      const response = await api.patch<ClassResponse>(`${BASE_URL}/${id}`, formData,
        {
          headers: {
            "Content-Type": "multipart/form-data" 
          }
        }
      );

      return response.data;
    } else {
      // Send as JSON if no files are involved (Cleaner network request)
      const response = await api.patch<ClassResponse>(`${BASE_URL}/${id}`, data);
      return response.data;
    }
  },

  // DELETE
  deleteClass: async (id: string) => {
    const response = await api.delete<ClassResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // HELPERS
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