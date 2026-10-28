import { randomUUID } from "node:crypto";
import { Schema, model, models } from "mongoose";
import type { IComplaint } from "./complaint.types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from "./complaint.types";

const complaintMessageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["CUSTOMER", "OWNER", "ADMIN"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    attachments: {
      type: [String],
      default: [],
      validate: {
        validator: (items: string[]) => items.length <= 5,
        message: "A message can have at most 5 attachments",
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const complaintSchema = new Schema<IComplaint>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      default: () =>
        `CMP-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: true,
    },
    priority: {
      type: String,
      enum: COMPLAINT_PRIORITIES,
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: "OPEN",
      index: true,
    },
    messages: {
      type: [complaintMessageSchema],
      default: [],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    resolvedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

complaintSchema.index({ customerId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });

const Complaint =
  models.Complaint || model<IComplaint>("Complaint", complaintSchema);

export { Complaint };
export default Complaint;
