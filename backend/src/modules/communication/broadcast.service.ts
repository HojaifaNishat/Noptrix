import { randomUUID } from "crypto";
import { Types } from "mongoose";

import { User, USER_STATUSES } from "../users/user.model";
import { Notification } from "../notifications/notification.model";
import { createNotification } from "../notifications/notification.service";
import { enqueueNotificationCreated } from "../../jobs/notification.job";
import { BroadcastCampaign } from "./broadcast.model";

const MAX_RECIPIENTS = 5000;

export type BroadcastAudience =
  | "ALL_ACTIVE_CUSTOMERS"
  | "SELECTED_CUSTOMERS";

interface SendBroadcastInput {
  title: string;
  message: string;
  audience: BroadcastAudience;
  customerIds?: string[];
  priority?: "low" | "normal" | "high" | "critical";
  adminId?: string;
}

export async function sendBroadcast(input: SendBroadcastInput) {
  const title = input.title.trim();
  const message = input.message.trim();

  if (!title || title.length > 200) {
    throw new Error("Title is required and must not exceed 200 characters.");
  }

  if (!message || message.length > 5000) {
    throw new Error("Message is required and must not exceed 5000 characters.");
  }

  let users: Array<{ _id: Types.ObjectId }>;

  if (input.audience === "ALL_ACTIVE_CUSTOMERS") {
    users = await User.find({ status: USER_STATUSES.ACTIVE })
      .select("_id")
      .limit(MAX_RECIPIENTS + 1)
      .lean();

    if (users.length > MAX_RECIPIENTS) {
      throw new Error(
        `Audience exceeds the ${MAX_RECIPIENTS}-customer limit.`,
      );
    }
  } else {
    const ids = [...new Set(input.customerIds ?? [])];

    if (ids.length === 0) {
      throw new Error("Select at least one customer.");
    }

    if (ids.length > MAX_RECIPIENTS) {
      throw new Error(`A maximum of ${MAX_RECIPIENTS} customers is allowed.`);
    }

    if (ids.some((id) => !Types.ObjectId.isValid(id))) {
      throw new Error("One or more customer IDs are invalid.");
    }

    users = await User.find({
      _id: { $in: ids },
      status: USER_STATUSES.ACTIVE,
    })
      .select("_id")
      .lean();

    if (users.length !== ids.length) {
      throw new Error(
        "Some selected customers do not exist or are not active.",
      );
    }
  }

  const broadcastId = randomUUID();
  const priority = input.priority ?? "normal";

  // Persist the campaign before attempting to enqueue notifications.
  const campaign = await BroadcastCampaign.create({
    broadcastId,
    title,
    message,
    audience: input.audience,
    priority,
    recipientCount: users.length,
    queuedCount: 0,
    failedCount: 0,
    createdBy: input.adminId,
  });

  let queuedCount = 0;
  let failedCount = 0;

  for (const user of users) {
    try {
      const notification = await createNotification({
        recipientId: user._id,
        type: "PROMOTION",
        priority,
        title,
        message,
        channels: ["in-app"],
        metadata: {
          broadcastId,
          audience: input.audience,
          createdBy: input.adminId,
        },
      });

      await enqueueNotificationCreated(
        { userId: String(user._id) },
        title,
        message,
        priority,
        { broadcastId },
        String(notification._id),
      );

      queuedCount += 1;
    } catch {
      failedCount += 1;
    }

    // Persist progress after each recipient so partial campaigns remain visible.
    await BroadcastCampaign.updateOne(
      { _id: campaign._id },
      { $set: { queuedCount, failedCount } },
    );
  }

  return {
    broadcastId,
    audience: input.audience,
    recipientCount: users.length,
    queuedCount,
    failedCount,
    status:
      failedCount === 0
        ? "QUEUED"
        : queuedCount > 0
          ? "PARTIAL"
          : "FAILED",
  };
}

export async function listBroadcastCampaigns(page = 1, limit = 20) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));

  const [items, total] = await Promise.all([
    BroadcastCampaign.find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    BroadcastCampaign.countDocuments(),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getBroadcastCampaignDetails(broadcastId: string) {
  const campaign = await BroadcastCampaign.findOne({ broadcastId }).lean();

  if (!campaign) {
    throw new Error("Broadcast campaign not found.");
  }

  const notifications = await Notification.find({
    "metadata.broadcastId": broadcastId,
  })
    .select("status deliveries readAt")
    .lean();

  const report = {
    notificationsCreated: notifications.length,
    pending: 0,
    sent: 0,
    partial: 0,
    failed: 0,
    read: 0,
    delivery: {
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      skipped: 0,
    },
  };

  for (const notification of notifications) {
    if (notification.status === "PENDING") report.pending += 1;
    else if (notification.status === "SENT") report.sent += 1;
    else if (notification.status === "PARTIAL") report.partial += 1;
    else if (notification.status === "FAILED") report.failed += 1;

    if (notification.readAt) report.read += 1;

    for (const delivery of notification.deliveries ?? []) {
      const status = delivery.status.toLowerCase() as keyof typeof report.delivery;

      if (status in report.delivery) {
        report.delivery[status] += 1;
      }
    }
  }

  return { campaign, report };
}
