
import apiClient from "@/services/api/client";

export interface UserSession {
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isCurrent?: boolean;
}

interface SessionsListResponse {
  success: boolean;
  message: string;
  data: UserSession[];
}

interface RevokeAllSessionsResponse {
  success: boolean;
  message: string;
  data?: {
    revokedCount?: number;
  };
}

interface SessionActionResponse {
  success: boolean;
  message: string;
}

export const sessionsApi = {
  async getMySessions(): Promise<UserSession[]> {
    const response =
      await apiClient.get<SessionsListResponse>("/sessions/me");

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Unable to retrieve sessions.",
      );
    }

    return response.data.data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    const response =
      await apiClient.delete<SessionActionResponse>(
        `/sessions/${encodeURIComponent(sessionId)}`,
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Unable to revoke this session.",
      );
    }
  },

  async revokeAllSessions(): Promise<number | undefined> {
    const response =
      await apiClient.post<RevokeAllSessionsResponse>(
        "/sessions/revoke-all",
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Unable to revoke sessions.",
      );
    }

    return response.data.data?.revokedCount;
  },
};

export default sessionsApi;
