import { api } from "./api";

// --- TYPES ---
const BASE_URL = "/classes";

export interface SchedulePayload {
  day: number; 
  startTime: string; 
  endTime: string;   
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
  // ... (Existing fields)
  name: string;
  description?: string;
  price?: number;
  batch?: string;
  timeSchedules?: SchedulePayload[];
  firstSessionDate?: string;
  recurrence?: "weekly" | "daily" | "none";
  totalSessions?: number;
  sessionDurationMinutes?: number;
  level?: "general" | "ordinary" | "advanced";
  type?: "theory" | "revision" | "paper";
  tags?: string[];
  isPublished?: boolean;
  coverImage?: File | null;
  images?: File[] | null;
  
  // Linking
  parentTheoryClass?: string; // <--- NEW

  // Variants Flags & Config
  createRevision?: boolean; 
  createPaper?: boolean;    
  revisionDay?: number;
  revisionStartTime?: string;
  revisionEndTime?: string;
  revisionPrice?: number;
  paperDay?: number;
  paperStartTime?: string;
  paperEndTime?: string;
  paperPrice?: number;
  bundlePriceRevision?: number; 
  bundlePricePaper?: number;    
  bundlePriceFull?: number;
}

export type UpdateClassPayload = Partial<CreateClassPayload>;

// Response Type (prevents using 'any')
export interface ClassData {
  _id: string;
  name: string;
  description: string;
  price: number;
  batch: string | any; 
  type: "theory" | "revision" | "paper";
  level: "general" | "ordinary" | "advanced"; 
  parentTheoryClass?: string | ClassData; // Can be ID or populated object
  linkedRevisionClass?: string | ClassData;
  linkedPaperClass?: string | ClassData;
  coverImage?: string;
  images: string[];
  isPublished: boolean;
  students?: EnrolledStudent[];
}

interface ClassResponse {
  success: boolean;
  message?: string;
  class?: ClassData;
  classes?: ClassData[];
}

// --- HELPER: FormData Builder ---
const buildClassFormData = (data: UpdateClassPayload): FormData => {
  const formData = new FormData();

  // Text Fields
if (data.name) formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.price !== undefined) formData.append("price", String(data.price));
  if (data.batch) formData.append("batch", data.batch);
  if (data.firstSessionDate) formData.append("firstSessionDate", data.firstSessionDate);
  if (data.recurrence) formData.append("recurrence", data.recurrence);
  if (data.type) formData.append("type", data.type);
  if (data.totalSessions !== undefined) formData.append("totalSessions", String(data.totalSessions));
  if (data.sessionDurationMinutes !== undefined) formData.append("sessionDurationMinutes", String(data.sessionDurationMinutes));
  if (data.level) formData.append("level", data.level);
  if (data.isPublished !== undefined) formData.append("isPublished", String(Boolean(data.isPublished)));
  if (data.tags && Array.isArray(data.tags)) formData.append("tags", JSON.stringify(data.tags));
  if (data.timeSchedules && Array.isArray(data.timeSchedules)) formData.append("timeSchedules", JSON.stringify(data.timeSchedules));
  if (data.coverImage) formData.append("coverImage", data.coverImage);
  if (data.images && Array.isArray(data.images)) data.images.forEach((file) => formData.append("images", file));

  // Variants & Linking
  if (data.createRevision !== undefined) formData.append("createRevision", String(data.createRevision));
  if (data.createPaper !== undefined) formData.append("createPaper", String(data.createPaper));
  if (data.parentTheoryClass) formData.append("parentTheoryClass", data.parentTheoryClass); // <--- NEW

  if (data.revisionDay !== undefined) formData.append("revisionDay", String(data.revisionDay));
  if (data.revisionStartTime) formData.append("revisionStartTime", data.revisionStartTime);
  if (data.revisionEndTime) formData.append("revisionEndTime", data.revisionEndTime);
  if (data.revisionPrice !== undefined) formData.append("revisionPrice", String(data.revisionPrice));
  
  if (data.paperDay !== undefined) formData.append("paperDay", String(data.paperDay));
  if (data.paperStartTime) formData.append("paperStartTime", data.paperStartTime);
  if (data.paperEndTime) formData.append("paperEndTime", data.paperEndTime);
  if (data.paperPrice !== undefined) formData.append("paperPrice", String(data.paperPrice));

  if (data.bundlePriceRevision !== undefined) formData.append("bundlePriceRevision", String(data.bundlePriceRevision));
  if (data.bundlePricePaper !== undefined) formData.append("bundlePricePaper", String(data.bundlePricePaper));
  if (data.bundlePriceFull !== undefined) formData.append("bundlePriceFull", String(data.bundlePriceFull));
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

  // Helper to fetch only Theory classes for dropdown
  getTheoryClasses: async () => {
    const response = await api.get<any[]>(BASE_URL);
    // Assuming backend returns array of classes. Filter on client side for simplicity.
    // If backend pagination exists, a dedicated endpoint `/classes?type=theory` is better.
    return response.data.filter((cls: any) => cls.type === 'theory');
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