import api from "../api/axios";
import type { Table, TableAvailability } from "../types/table";

export const tableService = {
  // Get all tables
  getAll: async (): Promise<Table[]> => {
    const response = await api.get<Table[]>("/tables");
    return response.data;
  },

  // Get table availability
  getAvailability: async (): Promise<TableAvailability[]> => {
    const response = await api.get<TableAvailability[]>(
      "/tables/availability"
    );
    return response.data;
  },

  // Get table by ID
  getById: async (id: string): Promise<Table> => {
    const response = await api.get<Table>(`/tables/${id}`);
    return response.data;
  },
};