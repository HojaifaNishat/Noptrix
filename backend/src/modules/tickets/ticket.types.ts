export const TICKET_STATUSES = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_CUSTOMER: "WAITING_FOR_CUSTOMER",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type TicketStatus =
  (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const TICKET_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TicketPriority =
  (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];

export const TICKET_AUTHOR_TYPES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
} as const;

export type TicketAuthorType =
  (typeof TICKET_AUTHOR_TYPES)[keyof typeof TICKET_AUTHOR_TYPES];
