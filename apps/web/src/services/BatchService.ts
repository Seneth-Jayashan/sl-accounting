import api from "./api"; // Your configured axios instance (e.g., with interceptors)

// --- Types ---
export interface BatchPayload {
  name: string;
  description?: string;
  startDate: string | Date; // Using string (ISO) or Date object
  endDate: string | Date;
  classes?: string[];       // Array of Class IDs to link
  isActive?: boolean;
}

export interface BatchData {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  classes: any[]; // You can replace 'any' with a partial Class interface if needed
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BatchResponse {
  success: boolean;
  message?: string;
  batch?: BatchData;
  batches?: BatchData[]; // For the getAll response
  count?: number;
}

// --- Service Definition ---
const BASE_URL = "/batches";

const BatchService = {
  /**
   * Create a new batch
   */
  createBatch: async (data: BatchPayload) => {
    const response = await api.post<BatchResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Get all batches
   * @param activeOnly If true, returns only active batches
   */
  getAllBatches: async (activeOnly: boolean = false) => {
    const queryString = activeOnly ? "?activeOnly=true" : "";
    const response = await api.get<BatchResponse>(`${BASE_URL}${queryString}`);
    return response.data;
  },

  /**
   * Get specific batch details
   */
  getBatchById: async (id: string) => {
    const response = await api.get<BatchResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Update existing batch
   */
  updateBatch: async (id: string, data: Partial<BatchPayload>) => {
    const response = await api.put<BatchResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a batch
   */
  deleteBatch: async (id: string) => {
    const response = await api.delete<BatchResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Toggle Active/Inactive status
   */
  toggleStatus: async (id: string) => {
    const response = await api.patch<{ success: boolean; message: string; isActive: boolean }>(
      `${BASE_URL}/${id}/toggle`
    );
    return response.data;
  },

  getBatchStudents: async (batchId: string) => {
    // Assumes you have an endpoint like: GET /api/v1/batches/:id/students
    // If not, you might filter users by batchId in your user service
    const response = await api.get(`${BASE_URL}/${batchId}/students`); 
    return response.data;
  },
};

export default BatchService;