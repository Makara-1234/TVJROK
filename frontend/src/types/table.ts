export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface TableAvailability {
  id: string;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
  isAvailable: boolean;
  status: string;
}