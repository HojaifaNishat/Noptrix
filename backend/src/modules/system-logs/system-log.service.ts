import {
    SystemLog,
    type ISystemLog,
} from "./system-log.model";

import type {
    ListSystemLogsQuery,
} from "./system-log.validator";

export type CreateSystemLogInput = Omit<
    ISystemLog,
    "createdAt"
>;

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
            output[key] =
                typeof value === "string"
                    ? value.slice(0, 1000)
                    : value;
        } else {
            output[key] = "[OMITTED]";
        }
    }

    return output;
}

export async function createSystemLog(
    input: CreateSystemLogInput,
) {
    return SystemLog.create({
        ...input,
        metadata: sanitizeMetadata(input.metadata),
    });
}

export async function listSystemLogs(
    query: ListSystemLogsQuery,
) {
    const filter: Record<string, unknown> = {};

    if (query.level) filter.level = query.level;
    if (query.source) filter.source = query.source;
    if (query.requestId) filter.requestId = query.requestId;
    if (query.correlationId) {
        filter.correlationId = query.correlationId;
    }
    if (query.errorCode) filter.errorCode = query.errorCode;

    if (query.from || query.to) {
        const dateFilter: { $gte?: Date; $lte?: Date } = {};

        if (query.from) dateFilter.$gte = new Date(query.from);
        if (query.to) dateFilter.$lte = new Date(query.to);

        filter.createdAt = dateFilter;
    }

    const skip = (query.page - 1) * query.limit;
    const direction = query.sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
        SystemLog.find(filter)
            .sort({ createdAt: direction, _id: direction })
            .skip(skip)
            .limit(query.limit)
            .lean()
            .exec(),
        SystemLog.countDocuments(filter).exec(),
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
