
import api from "../api/axios";
import type { Payment } from "../types/payment";

export const paymentService = {
  // GET ALL PAYMENTS
  getAll: async (): Promise<Payment[]> => {
    const response = await api.get<Payment[]>("/payments");
    return response.data;
  },

  // GET PAYMENT BY ID
  getById: async (id: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  // VERIFY PAYMENT
  verify: async (id: string, note?: string): Promise<Payment> => {
    const response = await api.put<Payment>(
      `/payments/${id}/verify`,
      { note: note || "Payment verified by administrator." }
    );

    return response.data;
  },

  // REJECT PAYMENT
  reject: async (id: string, reason: string): Promise<Payment> => {
    const response = await api.put<Payment>(
      `/payments/${id}/reject`,
      { reason }
    );

    return response.data;
  },
};
