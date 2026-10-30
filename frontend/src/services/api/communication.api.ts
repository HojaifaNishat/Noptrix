import apiClient from "./client";

import type {
  CreateInternalMessageInput,
  InternalMessage,
  MessageListQuery,
  MessageListResult,
  MessageAttachment,
  MessageBulkAction,
  MessageRecipientListResult,
  MessageRecipientQuery,
} from "@/features/communication/message.types";
import type { ApiResponse } from "@/types/api";

const BASE_PATH = "/communication/messages";

function normalizeId(id: string): string {
  const value = id.trim();

  if (!value) {
    throw new Error("Message ID is required.");
  }

  return encodeURIComponent(value);
}

export const communicationApi = {
  async getRecipients(
    params: MessageRecipientQuery = {},
  ): Promise<MessageRecipientListResult> {
    const response = await apiClient.get<
      ApiResponse<MessageRecipientListResult>
    >(`${BASE_PATH}/recipients`, { params });

    return response.data.data;
  },

  async getInbox(params: MessageListQuery = {}): Promise<MessageListResult> {
    const response = await apiClient.get<ApiResponse<MessageListResult>>(
      `${BASE_PATH}/inbox`,
      { params },
    );

    return response.data.data;
  },

  async getSent(params: MessageListQuery = {}): Promise<MessageListResult> {
    const response = await apiClient.get<ApiResponse<MessageListResult>>(
      `${BASE_PATH}/sent`,
      { params },
    );

    return response.data.data;
  },

  async getById(id: string): Promise<InternalMessage> {
    const response = await apiClient.get<ApiResponse<InternalMessage>>(
      `${BASE_PATH}/${normalizeId(id)}`,
    );

    return response.data.data;
  },

  async getThread(id: string): Promise<InternalMessage[]> {
    const response = await apiClient.get<
      ApiResponse<{ messages: InternalMessage[] }>
    >(`${BASE_PATH}/${normalizeId(id)}/thread`);
    return response.data.data.messages;
  },

  async reply(
    id: string,
    input: { body: string; attachments?: MessageAttachment[] },
  ): Promise<InternalMessage> {
    const response = await apiClient.post<ApiResponse<InternalMessage>>(
      `${BASE_PATH}/${normalizeId(id)}/replies`,
      input,
    );
    return response.data.data;
  },

  async uploadAttachments(files: File[]): Promise<MessageAttachment[]> {
    const input = new FormData();
    files.forEach((file) => input.append("files", file));
    const response = await apiClient.post<
      ApiResponse<{ attachments: MessageAttachment[] }>
    >(`${BASE_PATH}/attachments`, input);
    return response.data.data.attachments;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      `${BASE_PATH}/unread-count`,
    );
    return response.data.data.count;
  },

  async markAsUnread(id: string): Promise<InternalMessage> {
    const response = await apiClient.patch<ApiResponse<InternalMessage>>(
      `${BASE_PATH}/${normalizeId(id)}/unread`,
    );
    return response.data.data;
  },

  async bulkAction(
    messageIds: string[],
    action: MessageBulkAction,
  ): Promise<number> {
    const response = await apiClient.post<
      ApiResponse<{ modifiedCount: number }>
    >(`${BASE_PATH}/bulk-action`, { messageIds, action });
    return response.data.data.modifiedCount;
  },

  async create(input: CreateInternalMessageInput): Promise<InternalMessage> {
    const response = await apiClient.post<ApiResponse<InternalMessage>>(
      BASE_PATH,
      input,
    );

    return response.data.data;
  },

  async markAsRead(id: string): Promise<InternalMessage> {
    const response = await apiClient.patch<ApiResponse<InternalMessage>>(
      `${BASE_PATH}/${normalizeId(id)}/read`,
    );

    return response.data.data;
  },

  async archive(id: string): Promise<InternalMessage> {
    const response = await apiClient.patch<ApiResponse<InternalMessage>>(
      `${BASE_PATH}/${normalizeId(id)}/archive`,
    );

    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(
      `${BASE_PATH}/${normalizeId(id)}`,
    );
  },
};
