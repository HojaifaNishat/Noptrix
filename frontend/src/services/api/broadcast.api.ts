import apiClient from "./client";

import type {
  BroadcastCampaignDetails,
  BroadcastHistoryResponse,
  SendBroadcastPayload,
  SendBroadcastResult,
} from "@/features/announcements/broadcast.types";

import type { ApiResponse } from "@/types/api";

const BASE_PATH = "/communication/broadcast";

export async function sendBroadcast(
  payload: SendBroadcastPayload,
): Promise<SendBroadcastResult> {
  const response = await apiClient.post<ApiResponse<SendBroadcastResult>>(
    BASE_PATH,
    payload,
  );

  return response.data.data;
}

export async function getBroadcastHistory(
  page = 1,
  limit = 20,
): Promise<BroadcastHistoryResponse> {
  const response = await apiClient.get<ApiResponse<BroadcastHistoryResponse>>(
    `${BASE_PATH}/history`,
    { params: { page, limit } },
  );

  return response.data.data;
}

export async function getBroadcastDetails(
  broadcastId: string,
): Promise<BroadcastCampaignDetails> {
  const id = broadcastId.trim();

  if (!id) {
    throw new Error("Broadcast ID is required.");
  }

  const response = await apiClient.get<ApiResponse<BroadcastCampaignDetails>>(
    `${BASE_PATH}/history/${encodeURIComponent(id)}`,
  );

  return response.data.data;
}
