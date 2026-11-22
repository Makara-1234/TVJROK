
import api from "../api/axios";
import type { Payment, PaymentMethod } from "../types/payment";

export interface CreatePaymentDto {
  orderId: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string | null;
}

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

  // GET PAYMENT BY ORDER ID
  getByOrderId: async (orderId: string): Promise<Payment> => {
    const response = await api.get<Payment>(
      `/payments/order/${orderId}`
    );
    return response.data;
  },

  // CREATE PAYMENT
  create: async (data: CreatePaymentDto): Promise<Payment> => {
    const response = await api.post<Payment>("/payments", data);
    return response.data;
  },

  // UPLOAD PAYMENT RECEIPT
  uploadReceipt: async (
    paymentId: string,
    file: File
  ): Promise<Payment> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<Payment>(
      `/payments/${paymentId}/receipt`,
      formData
    );

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
