import apiClient from "./client";

import type { ApiResponse } from "@/types/api";

export interface CustomerSession {
  _id: string;
  userId: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  secretVerified: boolean;
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
  lastUsedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export const customerSessionsApi = {
  async getAll(userId: string): Promise<CustomerSession[]> {
    const response = await apiClient.get<ApiResponse<CustomerSession[]>>(
      `/sessions/admin/${userId}`,
    );
    return response.data.data;
  },

  async revoke(userId: string, sessionId: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(
      `/sessions/admin/${userId}/${sessionId}`,
    );
  },

  async revokeAll(userId: string): Promise<number> {
    const response = await apiClient.post<
      ApiResponse<{ revokedCount: number }>
    >(`/sessions/admin/${userId}/revoke-all`);
    return response.data.data.revokedCount;
  },
};
