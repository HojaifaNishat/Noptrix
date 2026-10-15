import { Types } from "mongoose";

import {
    Integration,
    type IIntegration,
} from "./integration.model";

import type {
    CreateIntegrationInput,
    ListIntegrationsQuery,
    UpdateIntegrationInput,
} from "./integration.validator";

export class IntegrationServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code: string,
    ) {
        super(message);
        this.name = "IntegrationServiceError";
    }
}

function toSafeIntegration(
    record: Record<string, unknown>,
) {
    const {
        secretEnvKeys,
        lastError,
        ...safe
    } = record;

    return {
        ...safe,
        secretsConfigured:
            Array.isArray(secretEnvKeys) &&
            secretEnvKeys.length > 0,
        hasRecentError: Boolean(lastError),
    };
}

export async function createIntegration(
    input: CreateIntegrationInput,
    actorId?: string,
) {
    const existing = await Integration.exists({
        name: input.name,
    });

    if (existing) {
        throw new IntegrationServiceError(
            "An integration with this name already exists.",
            409,
            "INTEGRATION_ALREADY_EXISTS",
        );
    }

    const record = await Integration.create({
        ...input,
        status: "INACTIVE",
        createdBy: actorId,
        updatedBy: actorId,
    });

    return toSafeIntegration(
        record.toObject() as unknown as Record<string, unknown>,
    );
}

export async function listIntegrations(
    query: ListIntegrationsQuery,
) {
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.provider) {
        filter.provider = query.provider.toLowerCase();
    }

    if (query.search) {
        const escaped = query.search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
        );

        filter.$or = [
            { name: { $regex: escaped, $options: "i" } },
            { provider: { $regex: escaped, $options: "i" } },
        ];
    }

    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
        Integration.find(filter)
            .select("-secretEnvKeys -lastError")
            .sort({ updatedAt: -1, _id: -1 })
            .skip(skip)
            .limit(query.limit)
            .lean()
            .exec(),
        Integration.countDocuments(filter).exec(),
    ]);

    return {
        items: records.map((record) =>
            toSafeIntegration(
                record as unknown as Record<string, unknown>,
            ),
        ),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
            hasNextPage: skip + records.length < total,
            hasPreviousPage: query.page > 1,
        },
    };
}

export async function getIntegrationById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
        throw new IntegrationServiceError(
            "Invalid integration ID.",
            400,
            "INVALID_INTEGRATION_ID",
        );
    }

    const record = await Integration.findById(id)
        .select("-secretEnvKeys -lastError")
        .lean()
        .exec();

    if (!record) {
        throw new IntegrationServiceError(
            "Integration not found.",
            404,
            "INTEGRATION_NOT_FOUND",
        );
    }

    return toSafeIntegration(
        record as unknown as Record<string, unknown>,
    );
}

export async function updateIntegration(
    id: string,
    input: UpdateIntegrationInput,
    actorId?: string,
) {
    if (!Types.ObjectId.isValid(id)) {
        throw new IntegrationServiceError(
            "Invalid integration ID.",
            400,
            "INVALID_INTEGRATION_ID",
        );
    }

    const record = await Integration.findByIdAndUpdate(
        id,
        {
            $set: {
                ...input,
                updatedBy: actorId,
            },
        },
        {
            new: true,
            runValidators: true,
        },
    )
        .select("-secretEnvKeys -lastError")
        .lean()
        .exec();

    if (!record) {
        throw new IntegrationServiceError(
            "Integration not found.",
            404,
            "INTEGRATION_NOT_FOUND",
        );
    }

    return toSafeIntegration(
        record as unknown as Record<string, unknown>,
    );
}

export async function deleteIntegration(id: string) {
    if (!Types.ObjectId.isValid(id)) {
        throw new IntegrationServiceError(
            "Invalid integration ID.",
            400,
            "INVALID_INTEGRATION_ID",
        );
    }

    const record = await Integration.findByIdAndDelete(id).exec();

    if (!record) {
        throw new IntegrationServiceError(
            "Integration not found.",
            404,
            "INTEGRATION_NOT_FOUND",
        );
    }
}

export async function markIntegrationChecked(
    id: string,
    successful: boolean,
    errorMessage?: string,
) {
    const update: Record<string, unknown> = {
        lastCheckedAt: new Date(),
        status: successful ? "ACTIVE" : "ERROR",
    };

    if (successful) {
        update.lastError = undefined;
    } else {
        update.lastError = (errorMessage || "Integration check failed.")
            .slice(0, 2000);
    }

    await Integration.findByIdAndUpdate(
        id,
        { $set: update },
        { runValidators: true },
    ).exec();
}
