
import api from "../api/axios";
import type { Table, TableAvailability } from "../types/table";

export interface CreateTableDto {
  tableNumber: string;
  capacity: number;
}

export interface UpdateTableDto {
  tableNumber: string;
  capacity: number;
  isActive: boolean;
}

export const tableService = {
  getAll: async (): Promise<Table[]> => {
    const response = await api.get<Table[]>("/tables");
    return response.data;
  },

  getAvailability: async (): Promise<TableAvailability[]> => {
    const response = await api.get<TableAvailability[]>("/tables/availability");
    return response.data;
  },

  getById: async (id: string): Promise<Table> => {
    const response = await api.get<Table>(`/tables/${id}`);
    return response.data;
  },

  create: async (data: CreateTableDto): Promise<Table> => {
    const response = await api.post<Table>("/tables", data);
    return response.data;
  },

  update: async (id: string, data: UpdateTableDto): Promise<void> => {
    await api.put(`/tables/${id}`, data);
  },

  deactivate: async (id: string): Promise<void> => {
    await api.delete(`/tables/${id}`);
  },
};
