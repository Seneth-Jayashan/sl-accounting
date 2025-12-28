import api from "./api";

// --- Types ---

// Lightweight type for Class relations to avoid circular dependencies or 'any'
export interface ClassSummary {
  _id: string;
  className: string;
  subject?: string;
}

export interface BatchPayload {
  name: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  classes?: string[]; // Array of Class IDs to link
  isActive?: boolean;
}

export interface BatchData {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  classes: ClassSummary[]; 
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BatchResponse {
  success: boolean;
  message?: string;
  batch?: BatchData;
  batches?: BatchData[];
  count?: number;
}

// --- Service Definition ---
const BASE_URL = "/batches";

const BatchService = {
  /**
   * Create a new batch (Admin Only)
   */
  createBatch: async (data: BatchPayload) => {
    const response = await api.post<BatchResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Get all batches (Admin filters)
   * Uses 'params' for safe URL encoding
   */
  getAllBatches: async (activeOnly: boolean = false) => {
    const response = await api.get<BatchResponse>(BASE_URL, {
      params: { activeOnly }
    });
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
   * Public endpoint for registration dropdowns
   * Usually unsecured or requires minimal generic token
   */
  getAllPublicBatches: async (activeOnly: boolean = true) => {
    const response = await api.get<BatchResponse>(`${BASE_URL}/public`, {
      params: { activeOnly }
    });
    return response.data;
  },

  /**
   * Update existing batch (Admin Only)
   */
  updateBatch: async (id: string, data: Partial<BatchPayload>) => {
    const response = await api.put<BatchResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a batch (Admin Only)
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

  /**
   * Get Students in a Batch
   */
  getBatchStudents: async (batchId: string) => {
    const response = await api.get(`${BASE_URL}/${batchId}/students`); 
    console.log("Batch Students Response:", response.data);
    return response.data;
  },
};

export default BatchService;