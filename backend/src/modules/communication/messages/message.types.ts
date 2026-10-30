import { Types } from "mongoose";

/*
|--------------------------------------------------------------------------
| Message Status
|--------------------------------------------------------------------------
*/

export const MESSAGE_STATUSES = {
  SENT: "SENT",
  READ: "READ",
  ARCHIVED: "ARCHIVED",
  DELETED: "DELETED",
} as const;

export type MessageStatus =
  (typeof MESSAGE_STATUSES)[keyof typeof MESSAGE_STATUSES];

/*
|--------------------------------------------------------------------------
| Message Priority
|--------------------------------------------------------------------------
*/

export const MESSAGE_PRIORITIES = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type MessagePriority =
  (typeof MESSAGE_PRIORITIES)[keyof typeof MESSAGE_PRIORITIES];

/*
|--------------------------------------------------------------------------
| Message Attachment
|--------------------------------------------------------------------------
*/

export interface MessageAttachment {
  name: string;
  publicId?: string;
  resourceType?: "image" | "raw";
  format?: string;
  mimeType: string;
  size: number;
  url?: string;
}

/*
|--------------------------------------------------------------------------
| Message Interface
|--------------------------------------------------------------------------
*/

export interface IMessage {
  _id: Types.ObjectId;

  senderId: Types.ObjectId;

  recipientId: Types.ObjectId;

  threadId?: Types.ObjectId;

  parentMessageId?: Types.ObjectId;

  subject: string;

  body: string;

  priority: MessagePriority;

  status: MessageStatus;

  attachments?: MessageAttachment[];

  readAt?: Date;

  unreadAt?: Date;

  archivedAt?: Date;

  deletedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}
