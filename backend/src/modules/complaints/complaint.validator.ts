import { z } from "zod";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from "./complaint.types";

const objectId = z.string().regex(
  /^[a-f\d]{24}$/i,
  "Invalid MongoDB ObjectId",
);

const attachmentList = z
  .array(z.string().trim().url().max(2048))
  .max(5)
  .default([]);

export const createComplaintSchema = z.object({
  orderId: objectId.optional(),
  subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(COMPLAINT_CATEGORIES),
  attachments: attachmentList,
});

export const complaintIdParamSchema = z.object({
  complaintId: objectId,
});

export const addComplaintMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  attachments: attachmentList,
});

export const updateComplaintSchema = z
  .object({
    status: z.enum(COMPLAINT_STATUSES).optional(),
    priority: z.enum(COMPLAINT_PRIORITIES).optional(),
    assignedTo: objectId.nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.assignedTo !== undefined,
    { message: "At least one field must be provided" },
  );

export const complaintQuerySchema = z.object({
  status: z.enum(COMPLAINT_STATUSES).optional(),
  category: z.enum(COMPLAINT_CATEGORIES).optional(),
  priority: z.enum(COMPLAINT_PRIORITIES).optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
