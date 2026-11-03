
import api from "../api/axios";

import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductQuery,
  PagedResponse,
} from "../types/product";

export const productService = {
  // =====================================
  // GET ALL PRODUCTS
  // =====================================
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>("/products");
    return response.data;
  },

  // =====================================
  // GET PRODUCT BY ID
  // =====================================
  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  // =====================================
  // GET PAGED PRODUCTS
  // =====================================
  getPaged: async (
    query: ProductQuery
  ): Promise<PagedResponse<Product>> => {
    const response = await api.get<PagedResponse<Product>>(
      "/products/paged",
      {
        params: query,
      }
    );

    return response.data;
  },

  // =====================================
  // CREATE PRODUCT
  // =====================================
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>("/products", data);
    return response.data;
  },

  // =====================================
  // UPDATE PRODUCT
  // =====================================
  update: async (
    id: string,
    data: UpdateProductDto
  ): Promise<void> => {
    await api.put(`/products/${id}`, data);
  },

  // =====================================
  // DELETE PRODUCT
  // =====================================
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // =====================================
  // UPLOAD PRODUCT IMAGE
  // =====================================
  uploadImage: async (
    productId: string,
    file: File
  ): Promise<{ message: string; imageUrl: string }> => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post<{
      message: string;
      imageUrl: string;
    }>(
      `/products/${productId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  // =====================================
  // DELETE PRODUCT IMAGE
  // =====================================
  deleteImage: async (
    productId: string,
    imageId: string
  ): Promise<void> => {
    await api.delete(
      `/products/${productId}/images/${imageId}`
    );
  },

  // =====================================
  // SET PRIMARY PRODUCT IMAGE
  // =====================================
  setPrimaryImage: async (
    productId: string,
    imageId: string
  ): Promise<void> => {
    await api.put(
      `/products/${productId}/images/${imageId}/primary`
    );
  },
};
