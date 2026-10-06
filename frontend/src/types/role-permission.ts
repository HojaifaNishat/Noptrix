import type { Permission } from "./permission";
import type { Role } from "./role";

export interface RolePermission {
  readonly id: string;
  readonly roleId: string | Role;
  readonly permissionId: string | Permission;
  readonly createdBy?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface AssignRolePermissionInput {
  readonly roleId: string;
  readonly permissionId: string;
}

export interface BulkRolePermissionInput {
  readonly roleId: string;
  readonly permissionIds: readonly string[];
}

export interface RolePermissionKeysResponse {
  readonly permissionKeys: string[];
}

export interface RolePermissionsResponse {
  readonly permissions: RolePermission[];
}

export interface RolePermissionRelationshipsResponse {
  readonly relationships: RolePermission[];
}

export interface RolesForPermissionResponse {
  readonly roles: RolePermission[];
}
