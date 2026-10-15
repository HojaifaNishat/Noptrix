import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  LiveChatConversation,
  LiveChatMessage,
  LiveChatPage,
  LiveChatStatus,
} from "@/features/live-chat/live-chat.types";

const BASE = "/live-chat";

function listFrom<T>(value: unknown): LiveChatPage<T> {
  if (Array.isArray(value)) {
    return { items: value as T[] };
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const items =
      record.items ??
      record.conversations ??
      record.messages ??
      record.results;

    if (Array.isArray(items)) {
      return {
        items: items as T[],
        pagination:
          record.pagination &&
          typeof record.pagination === "object"
            ? record.pagination as LiveChatPage<T>["pagination"]
            : undefined,
      };
    }
  }

  return { items: [] };
}

export const liveChatApi = {
  async createConversation(input: {
    subject?: string;
    message?: string;
  }): Promise<LiveChatConversation> {
    const response = await apiClient.post<
      ApiResponse<LiveChatConversation>
    >(BASE, input);

    return response.data.data;
  },

  async getCustomerConversations(): Promise<
    LiveChatPage<LiveChatConversation>
  > {
    const response = await apiClient.get<
      ApiResponse<unknown>
    >(`${BASE}/mine`, {
      params: { page: 1, limit: 100 },
    });

    return listFrom<LiveChatConversation>(response.data.data);
  },

  async getAdminInbox(): Promise<
    LiveChatPage<LiveChatConversation>
  > {
    const response = await apiClient.get<
      ApiResponse<unknown>
    >(`${BASE}/support/inbox`, {
      params: { page: 1, limit: 100 },
    });

    return listFrom<LiveChatConversation>(response.data.data);
  },

  async getOwnerInbox(): Promise<
    LiveChatPage<LiveChatConversation>
  > {
    const response = await apiClient.get<
      ApiResponse<unknown>
    >(`${BASE}/owner/inbox`, {
      params: { page: 1, limit: 100 },
    });

    return listFrom<LiveChatConversation>(response.data.data);
  },

  async getMessages(
    mode: "CUSTOMER" | "ADMIN" | "OWNER",
    conversationId: string,
  ): Promise<LiveChatPage<LiveChatMessage>> {
    const prefix =
      mode === "CUSTOMER"
        ? BASE
        : mode === "ADMIN"
          ? `${BASE}/support`
          : `${BASE}/owner`;

    const response = await apiClient.get<ApiResponse<unknown>>(
      `${prefix}/${conversationId}/messages`,
      { params: { page: 1, limit: 200 } },
    );

    return listFrom<LiveChatMessage>(response.data.data);
  },

  async sendMessage(
    mode: "CUSTOMER" | "ADMIN" | "OWNER",
    conversationId: string,
    body: string,
  ): Promise<LiveChatMessage> {
    const prefix =
      mode === "CUSTOMER"
        ? BASE
        : mode === "ADMIN"
          ? `${BASE}/support`
          : `${BASE}/owner`;

    const response = await apiClient.post<
      ApiResponse<{
        conversation: LiveChatConversation;
        message: LiveChatMessage;
      }>
    >(`${prefix}/${conversationId}/messages`, { body });

    return response.data.data.message;
  },

  async markRead(
    mode: "CUSTOMER" | "ADMIN" | "OWNER",
    conversationId: string,
  ): Promise<void> {
    const prefix =
      mode === "CUSTOMER"
        ? BASE
        : mode === "ADMIN"
          ? `${BASE}/support`
          : `${BASE}/owner`;

    await apiClient.patch(
      `${prefix}/${conversationId}/read`,
    );
  },

  async resolveConversation(
    mode: "ADMIN" | "OWNER",
    conversationId: string,
  ): Promise<LiveChatConversation> {
    const prefix =
      mode === "ADMIN"
        ? `${BASE}/support`
        : `${BASE}/owner`;

    const response = await apiClient.patch<
      ApiResponse<LiveChatConversation>
    >(`${prefix}/${conversationId}/resolve`);

    return response.data.data;
  },

  async assignConversation(
    conversationId: string,
    adminId: string,
  ): Promise<LiveChatConversation> {
    const response = await apiClient.patch<
      ApiResponse<LiveChatConversation>
    >(`${BASE}/owner/${conversationId}/assign`, {
      adminId,
    });

    return response.data.data;
  },

  async getMessagesByStatus(
    mode: "ADMIN" | "OWNER",
    status?: LiveChatStatus,
  ): Promise<LiveChatConversation[]> {
    const result =
      mode === "OWNER"
        ? await this.getOwnerInbox()
        : await this.getAdminInbox();

    return status
      ? result.items.filter((item) => item.status === status)
      : result.items;
  },
};
