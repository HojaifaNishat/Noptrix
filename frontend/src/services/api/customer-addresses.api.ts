import apiClient from "./client";

import type { ApiResponse, PaginatedResponse } from "@/types/api";

export interface CustomerAddress {
  _id: string;
  userId:
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
      }
    | string;
  type: "HOME" | "WORK" | "OTHER";
  label?: string;
  fullName: string;
  phone: string;
  country: string;
  countryCode?: string;
  state: string;
  city: string;
  area?: string;
  postalCode?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressFilters {
  page: number;
  limit: number;
  search?: string;
  type?: CustomerAddress["type"];
  isDefault?: boolean;
}

export const customerAddressesApi = {
  async getAll(
    filters: CustomerAddressFilters,
  ): Promise<PaginatedResponse<CustomerAddress>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<CustomerAddress>>
    >("/addresses/admin", { params: filters });
    return response.data.data;
  },
};
