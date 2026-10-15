import {
    AuditLog,
    type IAuditLog,
} from "./audit-log.model";
import type { ListAuditLogsQuery } from "./audit-log.validator";

export interface CreateAuditLogInput {
    actorId?: string;
    actorType: IAuditLog["actorType"];
    actorRole?: string;
    action: IAuditLog["action"];
    resource: string;
    resourceId?: string;
    description?: string;
    requestId?: string;
    method?: string;
    path?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
}

const SENSITIVE_KEY =
    /(password|secret|token|authorization|cookie|api.?key|credential|private.?key|otp|refresh.?token)/i;

function sanitizeMetadata(
    input: Record<string, unknown> | undefined,
): Record<string, unknown> {
    if (!input) return {};

    const output: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
        if (SENSITIVE_KEY.test(key)) {
            output[key] = "[REDACTED]";
            continue;
        }

        if (
            value === null ||
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            output[key] =
                typeof value === "string"
                    ? value.slice(0, 1000)
                    : value;
            continue;
        }

        if (
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            output[key] = sanitizeMetadata(
                value as Record<string, unknown>,
            );
            continue;
        }

        output[key] = "[OMITTED]";
    }

    return output;
}

export async function createAuditLog(
    input: CreateAuditLogInput,
) {
    return AuditLog.create({
        ...input,
        metadata: sanitizeMetadata(input.metadata),
        success: input.success ?? true,
    });
}

export async function listAuditLogs(
    query: ListAuditLogsQuery,
) {
    const filter: Record<string, unknown> = {};

    if (query.actorId) filter.actorId = query.actorId;
    if (query.actorType) filter.actorType = query.actorType;
    if (query.action) filter.action = query.action;
    if (query.resource) {
        filter.resource = query.resource.toLowerCase();
    }
    if (query.resourceId) filter.resourceId = query.resourceId;
    if (query.requestId) filter.requestId = query.requestId;

    if (query.success !== undefined) {
        filter.success = query.success;
    }

    if (query.from || query.to) {
        const createdAtFilter: {
            $gte?: Date;
            $lte?: Date;
        } = {};

        if (query.from) {
            createdAtFilter.$gte = new Date(query.from);
        }

        if (query.to) {
            createdAtFilter.$lte = new Date(query.to);
        }

        filter.createdAt = createdAtFilter;
    }

    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
        AuditLog.find(filter)
            .sort({ createdAt: sortDirection, _id: sortDirection })
            .skip(skip)
            .limit(query.limit)
            .lean()
            .exec(),

        AuditLog.countDocuments(filter).exec(),
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

export async function getAuditLogById(id: string) {
    return AuditLog.findById(id).lean().exec();
}
