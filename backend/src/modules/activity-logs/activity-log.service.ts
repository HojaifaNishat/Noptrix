import { ActivityLog, type IActivityLog } from "./activity-log.model";

import type { ListActivityLogsQuery } from "./activity-log.validator";

export type CreateActivityLogInput = Omit<IActivityLog, "createdAt">;

const SENSITIVE_KEY =
  /(password|secret|token|authorization|cookie|api.?key|credential|private.?key|otp)/i;

function sanitizeMetadata(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!input) return {};

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      output[key] = "[REDACTED]";
    } else if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      output[key] = typeof value === "string" ? value.slice(0, 1000) : value;
    } else {
      output[key] = "[OMITTED]";
    }
  }

  return output;
}

export async function createActivityLog(input: CreateActivityLogInput) {
  return ActivityLog.create({
    ...input,
    metadata: sanitizeMetadata(input.metadata),
  });
}

export async function listActivityLogs(query: ListActivityLogsQuery) {
  const filter: Record<string, unknown> = {};

  if (query.actorId) filter.actorId = query.actorId;
  if (query.actorType) filter.actorType = query.actorType;
  if (query.activityType) filter.activityType = query.activityType;
  if (query.action) filter.action = query.action;
  if (query.resource) filter.resource = query.resource;
  if (query.resourceId) filter.resourceId = query.resourceId;

  if (query.from || query.to) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {};

    if (query.from) dateFilter.$gte = new Date(query.from);
    if (query.to) dateFilter.$lte = new Date(query.to);

    filter.createdAt = dateFilter;
  }

  const skip = (query.page - 1) * query.limit;
  const direction = query.sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: direction, _id: direction })
      .skip(skip)
      .limit(query.limit)
      .lean()
      .exec(),
    ActivityLog.countDocuments(filter).exec(),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: skip + items.length < total,
      hasPreviousPage: query.page > 1,
    },
  };
}
