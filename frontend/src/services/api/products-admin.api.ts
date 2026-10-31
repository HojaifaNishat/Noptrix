import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api";

import type {
  Product,
  ProductFilters,
  ProductInput,
  ProductListResponse,
  ProductOption,
  ProductStatus,
  ProductUpdateInput,
} from "@/features/products/product.types";

export const productsAdminApi = {
  async list(filters: ProductFilters = {}): Promise<ProductListResponse> {
    const response = await apiClient.get<ApiResponse<ProductListResponse>>(
      "/products",
      { params: filters },
    );

    return response.data.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(
      `/products/${id}`,
    );

    return response.data.data;
  },

  async create(input: ProductInput): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>(
      "/products",
      input,
    );

    return response.data.data;
  },

  async update(
    id: string,
    input: ProductUpdateInput,
  ): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `/products/${id}`,
      input,
    );

    return response.data.data;
  },

  async updateStatus(
    id: string,
    status: ProductStatus,
  ): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `/products/${id}/status`,
      { status },
    );

    return response.data.data;
  },

  async archive(id: string): Promise<Product> {
    const response = await apiClient.delete<ApiResponse<Product>>(
      `/products/${id}`,
    );

    return response.data.data;
  },

  async getCategories(): Promise<ProductOption[]> {
    const response = await apiClient.get<ApiResponse<ProductOption[]>>(
      "/categories",
      {
        params: { page: 1, limit: 100 },
      },
    );

    return response.data.data ?? [];
  },

  async getSubcategories(): Promise<ProductOption[]> {
    const response = await apiClient.get<
      ApiResponse<{ items: ProductOption[] }>
    >("/subcategories", {
      params: { page: 1, limit: 100 },
    });

    return response.data.data.items ?? [];
  },

  async getBrands(): Promise<ProductOption[]> {
    const response = await apiClient.get<
      ApiResponse<{ items: ProductOption[] }>
    >("/brands", {
      params: { page: 1, limit: 100 },
    });

    return response.data.data.items ?? [];
  },

  async getCollections(): Promise<ProductOption[]> {
    const response = await apiClient.get<
      ApiResponse<{ items: ProductOption[] }>
    >("/collections/admin", {
      params: { page: 1, limit: 100 },
    });

    return response.data.data.items ?? [];
  },
};
