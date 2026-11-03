
export type OrderStatus =
  | "Pending"
  | "Confirm"
  | "Preparing"
  | "Complete"
  | "Cancel";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalAmount: number;
  currencyCode: string;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  items: CreateOrderItemDto[];
}
