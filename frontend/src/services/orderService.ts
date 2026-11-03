
import api from "../api/axios";

import type {
  Order,
  OrderStatus,
  OrderStatusHistory,
  CreateOrderDto,
} from "../types/order";

export const orderService = {
  // GET ALL ORDERS
  getAll: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>("/orders");
    return response.data;
  },

  // GET ORDER BY ID
  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // GET ORDER BY NUMBER
  getByNumber: async (orderNumber: string): Promise<Order> => {
    const response = await api.get<Order>(
      `/orders/number/${encodeURIComponent(orderNumber)}`
    );
    return response.data;
  },

  // CREATE NEW ORDER
  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await api.post<Order>("/orders", data);
    return response.data;
  },

  // UPDATE ORDER STATUS
  updateStatus: async (
    id: string,
    status: OrderStatus,
    note?: string
  ): Promise<void> => {
    await api.put(`/orders/${id}/status`, {
      status,
      note,
    });
  },

  // GET ORDER STATUS HISTORY
  getHistory: async (
    id: string
  ): Promise<OrderStatusHistory[]> => {
    const response = await api.get<OrderStatusHistory[]>(
      `/orders/${id}/history`
    );
    return response.data;
  },
};
