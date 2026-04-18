import { api } from "./api";

const BASE_URL = "/lesson-packs";

export interface PlaylistItem {
  _id?: string;
  title: string;
  youtubeUrl: string;
  youtubeId?: string;
  durationMinutes: number;
  order?: number;
  batch?: string; // For admin view to associate with batch 
}

export interface LessonPackData {
  _id: string;
  title: string;
  description?: string;
  price: number;
  coverImage?: string;
  videos: PlaylistItem[];
  isPublished: boolean;
  hasAccess?: boolean; // For student view
  createdAt: string;
  batch?: string; // For admin view to associate with batch
}

export interface LessonPackPayload {
  title: string;
  description?: string;
  price: number;
  videos: PlaylistItem[];
  isPublished: boolean;
  coverImageFile?: File | null;
  batch: string; // For admin view to associate with batch
}

const LessonPackService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: LessonPackData[] }>(BASE_URL);
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: LessonPackData }>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  create: async (data: LessonPackPayload) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("price", String(data.price));
    formData.append("isPublished", String(data.isPublished));
    formData.append("videos", JSON.stringify(data.videos));
    formData.append("batch", data.batch);
    if (data.coverImageFile) {
      formData.append("coverImage", data.coverImageFile);
    }

    const response = await api.post<{ success: boolean; data: LessonPackData }>(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  update: async (id: string, data: LessonPackPayload) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("price", String(data.price));
    formData.append("isPublished", String(data.isPublished));
    formData.append("videos", JSON.stringify(data.videos));
    formData.append("batch", data.batch);

    if (data.coverImageFile) {
      formData.append("coverImage", data.coverImageFile);
    }

    const response = await api.put<{ success: boolean; data: LessonPackData }>(`${BASE_URL}/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  togglePublish: async (id: string) => {
    const response = await api.patch<{ success: boolean; isPublished: boolean }>(`${BASE_URL}/${id}/publish`);
    return response.data;
  }
};

export default LessonPackService;