export const LIVE_CHAT_STATUSES = {
  OPEN: "OPEN",
  WAITING: "WAITING",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type LiveChatStatus =
  (typeof LIVE_CHAT_STATUSES)[keyof typeof LIVE_CHAT_STATUSES];

export const LIVE_CHAT_SENDER_TYPES = {
  CUSTOMER: "CUSTOMER",
  SUPPORT: "SUPPORT",
} as const;

export type LiveChatSenderType =
  (typeof LIVE_CHAT_SENDER_TYPES)[keyof typeof LIVE_CHAT_SENDER_TYPES];

export const LIVE_CHAT_MESSAGE_STATUSES = {
  SENT: "SENT",
  READ: "READ",
} as const;

export type LiveChatMessageStatus =
  (typeof LIVE_CHAT_MESSAGE_STATUSES)[keyof typeof LIVE_CHAT_MESSAGE_STATUSES];
