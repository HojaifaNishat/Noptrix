import type { Types } from "mongoose";

export const COMPLAINT_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "REJECTED",
  "CLOSED",
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export const COMPLAINT_CATEGORIES = [
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "PRODUCT",
  "REFUND",
  "ACCOUNT",
  "STAFF",
  "OTHER",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export interface IComplaintMessage {
  senderId: Types.ObjectId;
  senderRole: "CUSTOMER" | "OWNER" | "ADMIN";
  message: string;
  attachments: string[];
  createdAt: Date;
}

export interface IComplaint {
  ticketNumber: string;
  customerId: Types.ObjectId;
  orderId?: Types.ObjectId;
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  messages: IComplaintMessage[];
  assignedTo?: Types.ObjectId;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComplaintInput {
  orderId?: string;
  subject: string;
  description: string;
  category: ComplaintCategory;
  attachments?: string[];
}

export interface AddComplaintMessageInput {
  message: string;
  attachments?: string[];
}

export interface UpdateComplaintInput {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: string | null;
}
