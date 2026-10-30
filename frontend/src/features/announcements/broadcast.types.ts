export type BroadcastAudience =
  | "ALL_ACTIVE_CUSTOMERS"
  | "SELECTED_CUSTOMERS";

export type BroadcastPriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

export interface SendBroadcastPayload {
  title: string;
  message: string;
  audience: BroadcastAudience;
  customerIds?: string[];
  priority: BroadcastPriority;
}

export interface SendBroadcastResult {
  broadcastId: string;
  audience: BroadcastAudience;
  recipientCount: number;
  queuedCount: number;
  failedCount: number;
  status: "QUEUED" | "PARTIAL" | "FAILED";
}

export interface BroadcastCampaign {
  _id: string;
  broadcastId: string;
  title: string;
  message: string;
  audience: BroadcastAudience;
  priority: BroadcastPriority;
  recipientCount: number;
  queuedCount: number;
  failedCount: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BroadcastHistoryResponse {
  items: BroadcastCampaign[];
  pagination: BroadcastPagination;
}

export interface BroadcastReport {
  notificationsCreated: number;
  pending: number;
  sent: number;
  partial: number;
  failed: number;
  read: number;
  delivery: {
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
  };
}

export interface BroadcastCampaignDetails {
  campaign: BroadcastCampaign;
  report: BroadcastReport;
}
