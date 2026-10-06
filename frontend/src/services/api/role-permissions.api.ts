import apiClient from "./client";

import type { ApiResponse } from "@/types/api";

import type {
  BulkRolePermissionInput,
  RolePermission,
  RolePermissionKeysResponse,
  RolePermissionRelationshipsResponse,
  RolePermissionsResponse,
  RolesForPermissionResponse,
} from "@/types/role-permission";

export const rolePermissionsApi = {
  async assign(input: {
    readonly roleId: string;
    readonly permissionId: string;
  }): Promise<RolePermission> {
    const response = await apiClient.post<
      ApiResponse<{
        relationship: RolePermission;
      }>
    >("/role-permissions/assign", input);

    return response.data.data.relationship;
  },

  async remove(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete("/role-permissions/remove", {
      data: {
        roleId,
        permissionId,
      },
    });
  },

  async bulkAssign(input: BulkRolePermissionInput): Promise<RolePermission[]> {
    const response = await apiClient.post<
      ApiResponse<RolePermissionRelationshipsResponse>
    >("/role-permissions/bulk-assign", input);

    return response.data.data.relationships;
  },

  async bulkRemove(input: BulkRolePermissionInput): Promise<void> {
    await apiClient.delete("/role-permissions/bulk-remove", {
      data: input,
    });
  },

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const response = await apiClient.get<ApiResponse<RolePermissionsResponse>>(
      `/role-permissions/role/${roleId}`,
    );

    return response.data.data.permissions;
  },

  async getRolePermissionKeys(roleId: string): Promise<string[]> {
    const response = await apiClient.get<
      ApiResponse<RolePermissionKeysResponse>
    >(`/role-permissions/role/${roleId}/keys`);

    return response.data.data.permissionKeys;
  },

  async getRolesForPermission(permissionId: string): Promise<RolePermission[]> {
    const response = await apiClient.get<
      ApiResponse<RolesForPermissionResponse>
    >(`/role-permissions/permission/${permissionId}/roles`);

    return response.data.data.roles;
  },
};
