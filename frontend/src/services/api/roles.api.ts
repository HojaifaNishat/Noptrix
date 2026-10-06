import apiClient from "./client";

import type { ApiResponse } from "@/types/api";

import type { CreateRoleInput, Role, UpdateRoleInput } from "@/types/role";

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const response = await apiClient.get<
      ApiResponse<{
        roles: Role[];
      }>
    >("/roles");

    return response.data.data.roles;
  },

  async getById(roleId: string): Promise<Role> {
    const response = await apiClient.get<
      ApiResponse<{
        role: Role;
      }>
    >(`/roles/${roleId}`);

    return response.data.data.role;
  },

  async create(input: CreateRoleInput): Promise<Role> {
    const response = await apiClient.post<
      ApiResponse<{
        role: Role;
      }>
    >("/roles", input);

    return response.data.data.role;
  },

  async update(roleId: string, input: UpdateRoleInput): Promise<Role> {
    const response = await apiClient.patch<
      ApiResponse<{
        role: Role;
      }>
    >(`/roles/${roleId}`, input);

    return response.data.data.role;
  },

  async activate(roleId: string): Promise<Role> {
    const response = await apiClient.patch<
      ApiResponse<{
        role: Role;
      }>
    >(`/roles/${roleId}/activate`);

    return response.data.data.role;
  },

  async deactivate(roleId: string): Promise<Role> {
    const response = await apiClient.patch<
      ApiResponse<{
        role: Role;
      }>
    >(`/roles/${roleId}/deactivate`);

    return response.data.data.role;
  },

  async remove(roleId: string): Promise<void> {
    await apiClient.delete(`/roles/${roleId}`);
  },
};
