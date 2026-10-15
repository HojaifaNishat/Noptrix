export type LiveChatMode = "CUSTOMER" | "ADMIN" | "OWNER";

export type LiveChatStatus =
  | "OPEN"
  | "WAITING"
  | "RESOLVED"
  | "CLOSED";

export type LiveChatSenderType = "CUSTOMER" | "SUPPORT";

export interface LiveChatConversation {
  _id: string;
  customerId: string | { _id?: string; name?: string; email?: string };
  assignedAdminId?: string | { _id?: string; name?: string; email?: string };
  subject: string;
  status: LiveChatStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  customerUnreadCount: number;
  supportUnreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: LiveChatSenderType;
  body: string;
  status: "SENT" | "READ";
  readAt?: string;
  createdAt: string;
}

export interface LiveChatPage<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getEntityId(
  value: string | { _id?: string } | undefined,
): string {
  if (typeof value === "string") return value;
  return value?._id ?? "";
}

export function getEntityLabel(
  value: string | { name?: string; email?: string } | undefined,
): string {
  if (typeof value === "string") return value;
  return value?.name || value?.email || "";
}
