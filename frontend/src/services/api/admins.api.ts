import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Admin, AdminStatus } from "@/types/admin";

export interface UpdateAdminInput {
  roleId?: string;
  status?: AdminStatus;
}

export const adminsApi = {
  async getAll(): Promise<Admin[]> {
    const response = await apiClient.get<ApiResponse<Admin[]>>(
      "/admins",
    );

    return response.data.data;
  },

  async getById(adminId: string): Promise<Admin> {
    const response = await apiClient.get<ApiResponse<Admin>>(
      `/admins/${adminId}`,
    );

    return response.data.data;
  },

  async update(
    adminId: string,
    input: UpdateAdminInput,
  ): Promise<Admin> {
    const response = await apiClient.patch<ApiResponse<Admin>>(
      `/admins/${adminId}`,
      input,
    );

    return response.data.data;
  },
};
