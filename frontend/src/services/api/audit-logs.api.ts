import apiClient from "@/services/api/client";

export const AUDIT_ACTIONS = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "INVITATION_CREATED",
  "INVITATION_REVOKED",
  "PERMISSION_CHANGED",
  "STATUS_CHANGED",
  "APPROVED",
  "REJECTED",
  "EXPORTED",
  "IMPORTED",
  "SECURITY_EVENT",
  "OTHER",
] as const;

export const AUDIT_ACTOR_TYPES = [
  "OWNER",
  "ADMIN",
  "EMPLOYEE",
  "SELLER",
  "RIDER",
  "USER",
  "SYSTEM",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export interface AuditLog {
  _id: string;
  actorId?: string;
  actorType: AuditActorType;
  actorRole?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description?: string;
  requestId?: string;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success: boolean;
  createdAt: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  actorId?: string;
  actorType?: AuditActorType;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  from?: string;
  to?: string;
  requestId?: string;
  sortOrder?: "asc" | "desc";
}

interface AuditLogsListResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  pagination: AuditLogPagination;
}

interface AuditLogDetailResponse {
  success: boolean;
  message: string;
  data: AuditLog;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const auditLogsApi = {
  async getAll(filters: AuditLogFilters = {}) {
    try {
      const response = await apiClient.get<AuditLogsListResponse>(
        "/audit-logs",
        { params: filters },
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load audit logs.",
        );
      }

      return {
        items: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Unable to load audit logs."),
      );
    }
  },

  async getById(id: string): Promise<AuditLog> {
    try {
      const response = await apiClient.get<AuditLogDetailResponse>(
        `/audit-logs/${encodeURIComponent(id)}`,
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load audit log details.",
        );
      }

      return response.data.data;
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Unable to load audit log details."),
      );
    }
  },
};

export default auditLogsApi;
