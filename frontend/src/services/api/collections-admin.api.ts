import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api";

import type {
  Collection,
  CollectionFilters,
  CollectionInput,
  CollectionListResponse,
  CollectionUpdateInput,
  ProductOption,
} from "@/features/collections/collection.types";

export const collectionsAdminApi = {
  async list(
    filters: CollectionFilters = {},
  ): Promise<CollectionListResponse> {
    const response = await apiClient.get<ApiResponse<CollectionListResponse>>(
      "/collections/admin",
      { params: filters },
    );

    return response.data.data;
  },

  async getById(id: string): Promise<Collection> {
    const response = await apiClient.get<ApiResponse<Collection>>(
      `/collections/${id}`,
    );

    return response.data.data;
  },

  async create(input: CollectionInput): Promise<Collection> {
    const response = await apiClient.post<ApiResponse<Collection>>(
      "/collections",
      input,
    );

    return response.data.data;
  },

  async update(
    id: string,
    input: CollectionUpdateInput,
  ): Promise<Collection> {
    const response = await apiClient.patch<ApiResponse<Collection>>(
      `/collections/${id}`,
      input,
    );

    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/collections/${id}`);
  },

  async addProducts(
    id: string,
    productIds: string[],
  ): Promise<Collection> {
    const response = await apiClient.post<ApiResponse<Collection>>(
      `/collections/${id}/products`,
      { productIds },
    );

    return response.data.data;
  },

  async removeProducts(
    id: string,
    productIds: string[],
  ): Promise<Collection> {
    const response = await apiClient.delete<ApiResponse<Collection>>(
      `/collections/${id}/products`,
      { data: { productIds } },
    );

    return response.data.data;
  },

  async getProducts(): Promise<ProductOption[]> {
    const response = await apiClient.get<
      ApiResponse<{
        items: ProductOption[];
      }>
    >("/products", {
      params: { page: 1, limit: 100 },
    });

    return response.data.data.items ?? [];
  },
};
