export const ROLE_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type RoleStatus = (typeof ROLE_STATUSES)[keyof typeof ROLE_STATUSES];

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly hierarchyLevel: number;
  readonly isSystemRole: boolean;
  readonly status: RoleStatus;
  readonly createdBy?: string;
  readonly updatedBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateRoleInput {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly hierarchyLevel?: number;
}

export interface UpdateRoleInput {
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly hierarchyLevel?: number;
  readonly status?: RoleStatus;
}
