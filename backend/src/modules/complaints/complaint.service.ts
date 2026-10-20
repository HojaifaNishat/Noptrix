import { Types } from "mongoose";
import Complaint from "./complaint.model";
import type {
  AddComplaintMessageInput,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  CreateComplaintInput,
  UpdateComplaintInput,
} from "./complaint.types";

export class ComplaintServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ComplaintServiceError";
    this.statusCode = statusCode;
  }
}

function requireObjectId(id: string, field = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new ComplaintServiceError(`Invalid ${field}`, 400);
  }

  return new Types.ObjectId(id);
}

async function findComplaintOrThrow(complaintId: string) {
  const complaint = await Complaint.findById(
    requireObjectId(complaintId, "complaintId"),
  );

  if (!complaint) {
    throw new ComplaintServiceError("Complaint not found", 404);
  }

  return complaint;
}

export async function createComplaint(
  customerId: string,
  input: CreateComplaintInput,
) {
  const customerObjectId = requireObjectId(customerId, "customerId");

  const complaint = await Complaint.create({
    customerId: customerObjectId,
    ...(input.orderId
      ? { orderId: requireObjectId(input.orderId, "orderId") }
      : {}),
    subject: input.subject,
    description: input.description,
    category: input.category,
    status: "OPEN",
    priority: "MEDIUM",
    messages: [
      {
        senderId: customerObjectId,
        senderRole: "CUSTOMER",
        message: input.description,
        attachments: input.attachments ?? [],
      },
    ],
  });

  return complaint;
}

export async function getMyComplaints(
  customerId: string,
  query: {
    status?: ComplaintStatus;
    category?: ComplaintCategory;
    priority?: ComplaintPriority;
    page?: number;
    limit?: number;
  },
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const filter: Record<string, unknown> = {
    customerId: requireObjectId(customerId, "customerId"),
  };

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAllComplaints(query: {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { ticketNumber: { $regex: escaped, $options: "i" } },
      { subject: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMyComplaintById(
  complaintId: string,
  customerId: string,
) {
  const complaint = await Complaint.findOne({
    _id: requireObjectId(complaintId, "complaintId"),
    customerId: requireObjectId(customerId, "customerId"),
  });

  if (!complaint) {
    // Avoid disclosing whether another customer's complaint exists.
    throw new ComplaintServiceError("Complaint not found", 404);
  }

  return complaint;
}

export async function getComplaintById(complaintId: string) {
  return findComplaintOrThrow(complaintId);
}

export async function addCustomerMessage(
  complaintId: string,
  customerId: string,
  input: AddComplaintMessageInput,
) {
  const complaint = await getMyComplaintById(complaintId, customerId);

  if (["RESOLVED", "REJECTED", "CLOSED"].includes(complaint.status)) {
    throw new ComplaintServiceError(
      "This complaint is closed for replies",
      409,
    );
  }

  complaint.messages.push({
    senderId: requireObjectId(customerId, "customerId"),
    senderRole: "CUSTOMER",
    message: input.message,
    attachments: input.attachments ?? [],
  });

  if (complaint.status === "WAITING_FOR_CUSTOMER") {
    complaint.status = "IN_REVIEW";
  }

  await complaint.save();
  return complaint;
}

export async function addStaffMessage(
  complaintId: string,
  staffId: string,
  role: "OWNER" | "ADMIN",
  input: AddComplaintMessageInput,
) {
  const complaint = await findComplaintOrThrow(complaintId);

  if (["RESOLVED", "REJECTED", "CLOSED"].includes(complaint.status)) {
    throw new ComplaintServiceError(
      "This complaint is closed for replies",
      409,
    );
  }

  complaint.messages.push({
    senderId: requireObjectId(staffId, "staffId"),
    senderRole: role,
    message: input.message,
    attachments: input.attachments ?? [],
  });

  if (complaint.status === "OPEN") {
    complaint.status = "IN_REVIEW";
  }

  await complaint.save();
  return complaint;
}

export async function updateComplaint(
  complaintId: string,
  input: UpdateComplaintInput,
) {
  const complaint = await findComplaintOrThrow(complaintId);

  if (complaint.status === "CLOSED") {
    throw new ComplaintServiceError(
      "Closed complaints cannot be updated",
      409,
    );
  }

  if (input.status) {
    if (input.status === "RESOLVED") {
      complaint.resolvedAt = new Date();
      complaint.closedAt = undefined;
    } else if (input.status === "CLOSED") {
      complaint.closedAt = new Date();
    } else if (
      input.status === "OPEN" ||
      input.status === "IN_REVIEW" ||
      input.status === "WAITING_FOR_CUSTOMER"
    ) {
      complaint.resolvedAt = undefined;
      complaint.closedAt = undefined;
    }

    complaint.status = input.status;
  }

  if (input.priority) complaint.priority = input.priority;

  if (input.assignedTo !== undefined) {
    complaint.assignedTo = input.assignedTo
      ? requireObjectId(input.assignedTo, "assignedTo")
      : undefined;
  }

  await complaint.save();
  return complaint;
}

export async function deleteComplaint(
  complaintId: string,
) {
  const complaint = await findComplaintOrThrow(complaintId);

  if (complaint.status !== "OPEN" || complaint.messages.length > 1) {
    throw new ComplaintServiceError(
      "Only an untouched open complaint can be deleted",
      409,
    );
  }

  await complaint.deleteOne();
  return { message: "Complaint deleted successfully" };
}
