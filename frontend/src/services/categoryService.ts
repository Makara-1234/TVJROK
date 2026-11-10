
import api from "../api/axios";
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category";

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>("/categories");
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post<Category>("/categories", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateCategoryDto
  ): Promise<void> => {
    await api.put(`/categories/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
