import apiClient from "./client";

import type { ApiResponse } from "@/types/api";

import type {
  Attribute,
  AttributeListParams,
  AttributeListResult,
  CreateAttributeInput,
  UpdateAttributeInput,
  UpdateAttributeSortOrderInput,
  UpdateAttributeStatusInput,
} from "@/features/attributes/attribute.types";

interface BackendAttributeListResponse {
  data: Attribute[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const attributesAdminApi = {
  async getAll(
    params?: AttributeListParams,
  ): Promise<AttributeListResult> {
    const response = await apiClient.get<
      ApiResponse<BackendAttributeListResponse>
    >("/attributes/admin", { params });

    return {
      items: response.data.data.data,
      pagination: response.data.data.pagination,
    };
  },

  async getById(attributeId: string): Promise<Attribute> {
    const response = await apiClient.get<ApiResponse<Attribute>>(
      `/attributes/${attributeId}`,
    );

    return response.data.data;
  },

  async create(input: CreateAttributeInput): Promise<Attribute> {
    const response = await apiClient.post<ApiResponse<Attribute>>(
      "/attributes",
      input,
    );

    return response.data.data;
  },

  async update(
    attributeId: string,
    input: UpdateAttributeInput,
  ): Promise<Attribute> {
    const response = await apiClient.patch<ApiResponse<Attribute>>(
      `/attributes/${attributeId}`,
      input,
    );

    return response.data.data;
  },

  async updateStatus(
    attributeId: string,
    input: UpdateAttributeStatusInput,
  ): Promise<Attribute> {
    const response = await apiClient.patch<ApiResponse<Attribute>>(
      `/attributes/${attributeId}/status`,
      input,
    );

    return response.data.data;
  },

  async updateSortOrder(
    attributeId: string,
    input: UpdateAttributeSortOrderInput,
  ): Promise<Attribute> {
    const response = await apiClient.patch<ApiResponse<Attribute>>(
      `/attributes/${attributeId}/sort-order`,
      input,
    );

    return response.data.data;
  },

  async delete(attributeId: string): Promise<void> {
    await apiClient.delete(`/attributes/${attributeId}`);
  },
};
