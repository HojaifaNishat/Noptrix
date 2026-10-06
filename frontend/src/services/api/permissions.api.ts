import apiClient from "./client";

import type { ApiResponse } from "@/types/api";

import type {
  CreatePermissionInput,
  Permission,
  UpdatePermissionInput,
} from "@/types/permission";

export const permissionsApi = {
  async getAll(): Promise<Permission[]> {
    const response = await apiClient.get<
      ApiResponse<{
        permissions: Permission[];
      }>
    >("/permissions");

    return response.data.data.permissions;
  },

  async getById(permissionId: string): Promise<Permission> {
    const response = await apiClient.get<
      ApiResponse<{
        permission: Permission;
      }>
    >(`/permissions/${permissionId}`);

    return response.data.data.permission;
  },

  async create(input: CreatePermissionInput): Promise<Permission> {
    const response = await apiClient.post<
      ApiResponse<{
        permission: Permission;
      }>
    >("/permissions", input);

    return response.data.data.permission;
  },

  async update(
    permissionId: string,
    input: UpdatePermissionInput,
  ): Promise<Permission> {
    const response = await apiClient.patch<
      ApiResponse<{
        permission: Permission;
      }>
    >(`/permissions/${permissionId}`, input);

    return response.data.data.permission;
  },

  async activate(permissionId: string): Promise<Permission> {
    const response = await apiClient.patch<
      ApiResponse<{
        permission: Permission;
      }>
    >(`/permissions/${permissionId}/activate`);

    return response.data.data.permission;
  },

  async deactivate(permissionId: string): Promise<Permission> {
    const response = await apiClient.patch<
      ApiResponse<{
        permission: Permission;
      }>
    >(`/permissions/${permissionId}/deactivate`);

    return response.data.data.permission;
  },

  async remove(permissionId: string): Promise<void> {
    await apiClient.delete(`/permissions/${permissionId}`);
  },
};
