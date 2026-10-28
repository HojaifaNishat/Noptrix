
import apiClient from "@/services/api/client";

export type ActivityActorType =
  | "OWNER"
  | "ADMIN"
  | "EMPLOYEE"
  | "SELLER"
  | "RIDER"
  | "USER"
  | "SYSTEM";

export type ActivityType =
  | "AUTHENTICATION"
  | "PROFILE"
  | "PRODUCT"
  | "ORDER"
  | "PAYMENT"
  | "INVENTORY"
  | "SUPPORT"
  | "COMMUNICATION"
  | "SETTINGS"
  | "SECURITY"
  | "OTHER";

export interface ActivityLog {
  _id?: string;
  id?: string;
  actorId?: string;
  actorType: ActivityActorType;
  actorRole?: string;
  activityType: ActivityType;
  action: string;
  description: string;
  resource?: string;
  resourceId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  actorId?: string;
  actorType?: ActivityActorType;
  activityType?: ActivityType;
  action?: string;
  resource?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  sortOrder?: "asc" | "desc";
}

interface ActivityLogResponse {
  success: boolean;
  message: string;
  data: ActivityLog[];
  pagination: ActivityLogPagination;
}

export const activityLogsApi = {
  async getAll(filters: ActivityLogFilters = {}) {
    const response = await apiClient.get<ActivityLogResponse>(
      "/activity-logs",
      { params: filters },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Unable to load activity logs.",
      );
    }

    return {
      items: response.data.data,
      pagination: response.data.pagination,
    };
  },
};

export default activityLogsApi;
