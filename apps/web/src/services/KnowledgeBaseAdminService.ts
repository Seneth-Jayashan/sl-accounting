import api from './api';

// --- Types ---
export interface KnowledgePayload {
  title: string;
  description?: string;
  catageory?: string;
  isPublished?: boolean;
  publishAt?: string | Date;
  // file should be attached as FormData when uploading
}

export interface KnowledgeItem {
  _id: string;
  title: string;
  description?: string;
  catageory?: string;
  fileName?: string;
  fileMime?: string;
  filePath?: string;
  isPublished: boolean;
  publishAt?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: any;
}

const BASE = '/knowledge';

const KnowledgeBaseAdminService = {
  create: async (form: FormData) => {
    const res = await api.post(`${BASE}`, form);
    return res.data;
  },

  getAll: async (params?: Record<string, any>) => {
    const res = await api.get(`${BASE}`, { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  },

  update: async (id: string, payload: FormData | Record<string, any>) => {
    const res = await api.put(`${BASE}/${id}`, payload as any);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  },

  bulkDelete: async (ids: string[]) => {
    const res = await api.post(`${BASE}/bulk-delete`, { ids });
    return res.data;
  },

  download: async (id: string) => {
    const res = await api.get(`${BASE}/${id}/download`, { responseType: 'blob' });
    return res;
  },

  getSize: async (id: string) => {
    const res = await api.get(`${BASE}/${id}/size`);
    return res.data;
  },

  publish: async (id: string) => {
    const res = await api.put(`${BASE}/${id}`, { isPublished: true });
    return res.data;
  },
};

export default KnowledgeBaseAdminService;
