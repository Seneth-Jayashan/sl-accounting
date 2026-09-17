import { api } from "./api";

export interface MaterialCategoryData {
  _id: string;
  name: string;
  createdAt: string;
}

const BASE_URL = "/material-categories";

const MaterialCategoryService = {
  getAllCategories: async () => {
    const response = await api.get<{ success: boolean; data: MaterialCategoryData[] }>(BASE_URL);
    return response.data.data;
  },

  createCategory: async (name: string) => {
    const response = await api.post<{ success: boolean; data: MaterialCategoryData }>(BASE_URL, { name });
    return response.data.data;
  },

  deleteCategory: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  }
};

export default MaterialCategoryService;
