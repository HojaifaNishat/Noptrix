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
    id: string;
    key: string;
    name: string;
    description?: string;
    action: PermissionAction;
}