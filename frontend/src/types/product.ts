export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  createdAt: string;
}

export interface CreateProductDto {
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface UpdateProductDto extends CreateProductDto {}

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}