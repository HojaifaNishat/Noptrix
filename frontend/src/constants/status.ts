export const STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    SUSPENDED: "SUSPENDED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
} as const;

export type Status =
    (typeof STATUS)[keyof typeof STATUS];