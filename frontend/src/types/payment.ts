
export type PaymentMethod = "KHQR" | "Cash";

export type PaymentStatus =
  | "Pending"
  | "Verified"
  | "Rejected"
  | "Refunded";

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currencyCode: string;
  transactionReference: string | null;
  receiptImageUrl: string | null;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
}
