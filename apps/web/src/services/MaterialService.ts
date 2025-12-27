import { api } from "./api";

const BASE_URL = "/materials";

// --- TYPES ---

export interface MaterialData {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: "pdf" | "pptx" | "docx" | "image" | "other";
  fileSize: string;
  class: string | any; // Can be ID or populated Class object
  createdAt: string;
  updatedAt: string;
}

export interface MaterialResponse {
  success: boolean;
  message?: string;
  data?: MaterialData | MaterialData[];
  count?: number;
}

// --- SERVICE ---

const MaterialService = {
  /**
   * Admin: Upload new material (PDF, PPTX, etc.)
   * Uses multipart/form-data for file transmission
   */
  uploadMaterial: async (formData: FormData) => {
    const response = await api.post<MaterialResponse>(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Admin: Fetch all materials
   * @param classId - Optional filter to get materials for a specific class
   */
  getAllMaterials: async (classId?: string) => {
    const url = classId ? `${BASE_URL}?classId=${classId}` : BASE_URL;
    const response = await api.get<MaterialResponse>(url);
    return response.data;
  },

  /**
   * Student: Fetch materials for their specific class
   */
  getStudentMaterials: async (classId: string) => {
    const response = await api.post<MaterialResponse>(`${BASE_URL}/view-class`, { 
      classId 
    });
    return response.data;
  },

  /**
   * Admin: Delete material and physical file
   */
  deleteMaterial: async (id: string) => {
    const response = await api.delete<MaterialResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default MaterialService;