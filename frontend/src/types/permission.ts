export const PERMISSION_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type PermissionStatus =
  (typeof PERMISSION_STATUSES)[keyof typeof PERMISSION_STATUSES];

export const PERMISSION_ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  APPROVE: "approve",
  REJECT: "reject",
  SUSPEND: "suspend",
  ACTIVATE: "activate",
  EXPORT: "export",
  IMPORT: "import",
  REFUND: "refund",
  CANCEL: "cancel",
  MANAGE: "manage",
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

export interface Permission {
  readonly id: string;
  readonly resource: string;
  readonly action: PermissionAction;
  readonly key: string;
  readonly description?: string;
  readonly isSystemPermission: boolean;
  readonly status: PermissionStatus;
  readonly createdBy?: string;
  readonly updatedBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatePermissionInput {
  readonly resource: string;
  readonly action: PermissionAction;
  readonly key: string;
  readonly description?: string;
  readonly isSystemPermission?: boolean;
}

export interface UpdatePermissionInput {
  readonly resource?: string;
  readonly action?: PermissionAction;
  readonly key?: string;
  readonly description?: string;
  readonly status?: PermissionStatus;
}
