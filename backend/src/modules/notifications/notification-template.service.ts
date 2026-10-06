import {
    Types,
} from "mongoose";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    logger,
} from "../../utils/logger";

import {
    NotificationTemplate,
    NotificationTemplateChannel,
    NotificationTemplateStatus,
    NOTIFICATION_TEMPLATE_STATUSES,
} from "./notification-template.model";

import {
    CreateNotificationTemplateInput,
    NotificationTemplateQueryInput,
    UpdateNotificationTemplateInput,
} from "./notification-template.validator";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface NotificationTemplateListResult {
    readonly items: typeof NotificationTemplate.prototype[];
    readonly pagination: {
        readonly page: number;
        readonly limit: number;
        readonly total: number;
        readonly totalPages: number;
        readonly hasNextPage: boolean;
        readonly hasPreviousPage: boolean;
    };
}

export interface ResolveNotificationTemplateInput {
    readonly key: string;
    readonly channel: NotificationTemplateChannel;
    readonly locale?: string;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeKey = (value: string): string =>
    value.trim().toLowerCase();

const normalizeEvent = (value: string): string =>
    value.trim().toUpperCase();

const normalizeLocale = (value: string): string =>
    value.trim().toLowerCase();

const normalizeVariables = (variables: readonly string[]): string[] =>
    Array.from(
        new Set(
            variables
                .map((variable) => variable.trim().toLowerCase())
                .filter(Boolean),
        ),
    );

const validateObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(`Invalid ${fieldName}.`);
    }

    return new Types.ObjectId(value);
};

const buildTemplateIdentifier = (
    key: string,
    channel: NotificationTemplateChannel,
    locale: string,
): string => `${key}:${channel}:${locale}`;

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export const createNotificationTemplate = async (
    creatorId: string,
    input: CreateNotificationTemplateInput,
) => {
    const createdBy = validateObjectId(
        creatorId,
        "creator ID",
    );

    const key = normalizeKey(input.key);
    const event = normalizeEvent(input.event);
    const locale = normalizeLocale(input.locale);
    const variables = normalizeVariables(input.variables);

    const existingTemplate = await NotificationTemplate.findOne({
        key,
        channel: input.channel,
        locale,
    }).lean();

    if (existingTemplate) {
        throw ApiError.conflict(
            `Notification template already exists for ${buildTemplateIdentifier(
                key,
                input.channel,
                locale,
            )}.`,
        );
    }

    const template = await NotificationTemplate.create({
        key,
        name: input.name.trim(),
        description: input.description?.trim(),
        event,
        channel: input.channel,
        locale,
        title: input.title.trim(),
        body: input.body.trim(),
        status:
            input.status ??
            NOTIFICATION_TEMPLATE_STATUSES.ACTIVE,
        variables,
        createdBy,
        updatedBy: createdBy,
    });

    logger.info(
        {
            templateId: template._id.toString(),
            key: template.key,
            event: template.event,
            channel: template.channel,
            locale: template.locale,
        },
        "Notification template created.",
    );

    return template;
};

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/

export const getNotificationTemplateById = async (
    templateId: string,
) => {
    const _id = validateObjectId(
        templateId,
        "notification template ID",
    );

    const template = await NotificationTemplate.findById(_id);

    if (!template) {
        throw ApiError.notFound(
            "Notification template not found.",
        );
    }

    return template;
};

/*
|--------------------------------------------------------------------------
| Resolve Template
|--------------------------------------------------------------------------
|
| Used by notification creation logic to find the correct
| template for a notification event.
|
*/

export const resolveNotificationTemplate = async (
    input: ResolveNotificationTemplateInput,
) => {
    const key = normalizeKey(input.key);
    const locale = normalizeLocale(
        input.locale ?? "en",
    );

    const template = await NotificationTemplate.findOne({
        key,
        channel: input.channel,
        locale,
        status: NOTIFICATION_TEMPLATE_STATUSES.ACTIVE,
    });

    if (template) {
        return template;
    }

    /*
    |--------------------------------------------------------------------------
    | Locale Fallback
    |--------------------------------------------------------------------------
    |
    | Example:
    | en-US → en
    |
    */

    if (locale.includes("-")) {
        const baseLocale = locale.split("-")[0];

        const fallbackTemplate =
            await NotificationTemplate.findOne({
                key,
                channel: input.channel,
                locale: baseLocale,
                status: NOTIFICATION_TEMPLATE_STATUSES.ACTIVE,
            });

        if (fallbackTemplate) {
            return fallbackTemplate;
        }
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Render Resolved Template
|--------------------------------------------------------------------------
|
| Resolves an ACTIVE template and renders its title/body using
| runtime variables.
|
| This is intentionally generic and can be used by:
|
| - Employee invitations
| - Job vacancies
| - Job applications
| - Orders
| - Payments
| - Deliveries
| - Sellers
| - Riders
| - Promotions
| - Security
| - System notifications
|
|--------------------------------------------------------------------------
*/

export interface RenderNotificationTemplateInput {
    readonly key: string;
    readonly channel: NotificationTemplateChannel;
    readonly locale?: string;
    readonly variables?: Readonly<Record<string, unknown>>;
}

export interface RenderNotificationTemplateResult {
    readonly templateId: string;
    readonly key: string;
    readonly event: string;
    readonly channel: NotificationTemplateChannel;
    readonly locale: string;
    readonly title: string;
    readonly message: string;
}

export const renderNotificationTemplate = async (
    input: RenderNotificationTemplateInput,
): Promise<RenderNotificationTemplateResult> => {
    const template =
        await resolveNotificationTemplate({
            key: input.key,
            channel: input.channel,
            locale: input.locale,
        });

    if (!template) {
        throw ApiError.notFound(
            `Active notification template not found for ${buildTemplateIdentifier(
                normalizeKey(input.key),
                input.channel,
                normalizeLocale(input.locale ?? "en"),
            )}.`,
        );
    }

    const variables =
        input.variables ?? {};

    /*
    |--------------------------------------------------------------------------
    | Variable Validation
    |--------------------------------------------------------------------------
    |
    | The renderer preserves unknown placeholders.
    | Here we enforce that every variable declared by the
    | administrator is available at runtime.
    |
    */

    const requiredVariables =
        normalizeVariables(
            template.variables,
        );

    const missingVariables =
        requiredVariables.filter(
            (variable) =>
                !Object.prototype.hasOwnProperty.call(
                    variables,
                    variable,
                ),
        );

    if (missingVariables.length > 0) {
        throw ApiError.badRequest(
            `Missing notification template variables: ${missingVariables.join(
                ", ",
            )}.`,
            {
                code:
                    "NOTIFICATION_TEMPLATE_VARIABLES_MISSING",
                details: {
                    templateId:
                        template._id.toString(),
                    templateKey:
                        template.key,
                    missingVariables,
                },
            },
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Dynamic Renderer Import
    |--------------------------------------------------------------------------
    |
    | Keeps template persistence and rendering concerns separated.
    |
    */

    const {
        renderNotificationContent,
    } = await import(
        "./notification-template.renderer.js"
    );

    const rendered =
        renderNotificationContent(
            template.title,
            template.body,
            variables,
        );

    if (!rendered.title.trim()) {
        throw ApiError.internal(
            "Rendered notification title is empty.",
            {
                code:
                    "NOTIFICATION_TEMPLATE_EMPTY_TITLE",
            },
        );
    }

    if (!rendered.message.trim()) {
        throw ApiError.internal(
            "Rendered notification message is empty.",
            {
                code:
                    "NOTIFICATION_TEMPLATE_EMPTY_BODY",
            },
        );
    }

    return {
        templateId:
            template._id.toString(),

        key:
            template.key,

        event:
            template.event,

        channel:
            template.channel,

        locale:
            template.locale,

        title:
            rendered.title,

        message:
            rendered.message,
    };
};

/*
|--------------------------------------------------------------------------
| Require Template
|--------------------------------------------------------------------------
*/

export const requireNotificationTemplate = async (
    input: ResolveNotificationTemplateInput,
) => {
    const template =
        await resolveNotificationTemplate(input);

    if (!template) {
        throw ApiError.notFound(
            `Active notification template not found for ${buildTemplateIdentifier(
                normalizeKey(input.key),
                input.channel,
                normalizeLocale(input.locale ?? "en"),
            )}.`,
        );
    }

    return template;
};

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

export const listNotificationTemplates = async (
    query: NotificationTemplateQueryInput,
): Promise<NotificationTemplateListResult> => {
    const {
        key,
        event,
        channel,
        locale,
        status,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
    } = query;

    const filter: Record<string, unknown> = {};

    if (key) {
        filter.key = normalizeKey(key);
    }

    if (event) {
        filter.event = normalizeEvent(event);
    }

    if (channel) {
        filter.channel = channel;
    }

    if (locale) {
        filter.locale = normalizeLocale(locale);
    }

    if (status) {
        filter.status = status;
    }

    if (search) {
        const escapedSearch = search
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.$or = [
            {
                name: {
                    $regex: escapedSearch,
                    $options: "i",
                },
            },
            {
                key: {
                    $regex: escapedSearch,
                    $options: "i",
                },
            },
            {
                event: {
                    $regex: escapedSearch,
                    $options: "i",
                },
            },
            {
                description: {
                    $regex: escapedSearch,
                    $options: "i",
                },
            },
        ];
    }

    const skip = (page - 1) * limit;

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
        NotificationTemplate.find(filter)
            .sort({
                [sortBy]: sortDirection,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

        NotificationTemplate.countDocuments(filter),
    ]);

    const totalPages =
        total === 0
            ? 0
            : Math.ceil(total / limit);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage:
                totalPages > 0 && page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export const updateNotificationTemplate = async (
    templateId: string,
    updaterId: string,
    input: UpdateNotificationTemplateInput,
) => {
    const _id = validateObjectId(
        templateId,
        "notification template ID",
    );

    const updatedBy = validateObjectId(
        updaterId,
        "updater ID",
    );

    const template =
        await NotificationTemplate.findById(_id);

    if (!template) {
        throw ApiError.notFound(
            "Notification template not found.",
        );
    }

    const nextKey = template.key;

    const nextChannel =
        input.channel ?? template.channel;

    const nextLocale = normalizeLocale(
        input.locale ?? template.locale,
    );

    if (
        input.channel !== undefined ||
        input.locale !== undefined
    ) {
        const duplicate =
            await NotificationTemplate.findOne({
                _id: {
                    $ne: template._id,
                },
                key: nextKey,
                channel: nextChannel,
                locale: nextLocale,
            }).lean();

        if (duplicate) {
            throw ApiError.conflict(
                `Notification template already exists for ${buildTemplateIdentifier(
                    nextKey,
                    nextChannel,
                    nextLocale,
                )}.`,
            );
        }
    }

    if (input.name !== undefined) {
        template.name = input.name.trim();
    }

    if (input.description !== undefined) {
        template.description =
            input.description?.trim();
    }

    if (input.event !== undefined) {
        template.event = normalizeEvent(input.event);
    }

    if (input.channel !== undefined) {
        template.channel = input.channel;
    }

    if (input.locale !== undefined) {
        template.locale = nextLocale;
    }

    if (input.title !== undefined) {
        template.title = input.title.trim();
    }

    if (input.body !== undefined) {
        template.body = input.body.trim();
    }

    if (input.status !== undefined) {
        template.status = input.status;
    }

    if (input.variables !== undefined) {
        template.variables = normalizeVariables(
            input.variables,
        );
    }

    template.updatedBy = updatedBy;

    await template.save();

    logger.info(
        {
            templateId: template._id.toString(),
            updatedBy: updatedBy.toString(),
        },
        "Notification template updated.",
    );

    return template;
};

/*
|--------------------------------------------------------------------------
| Activate
|--------------------------------------------------------------------------
*/

export const activateNotificationTemplate = async (
    templateId: string,
    updaterId: string,
) => {
    return updateNotificationTemplate(
        templateId,
        updaterId,
        {
            status:
                NOTIFICATION_TEMPLATE_STATUSES.ACTIVE,
        },
    );
};

/*
|--------------------------------------------------------------------------
| Deactivate
|--------------------------------------------------------------------------
*/

export const deactivateNotificationTemplate = async (
    templateId: string,
    updaterId: string,
) => {
    return updateNotificationTemplate(
        templateId,
        updaterId,
        {
            status:
                NOTIFICATION_TEMPLATE_STATUSES.INACTIVE,
        },
    );
};

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export const deleteNotificationTemplate = async (
    templateId: string,
) => {
    const _id = validateObjectId(
        templateId,
        "notification template ID",
    );

    const template =
        await NotificationTemplate.findById(_id);

    if (!template) {
        throw ApiError.notFound(
            "Notification template not found.",
        );
    }

    await NotificationTemplate.deleteOne({
        _id: template._id,
    });

    logger.info(
        {
            templateId: template._id.toString(),
            key: template.key,
        },
        "Notification template deleted.",
    );

    return {
        templateId: template._id.toString(),
        deleted: true,
    };
};

/*
|--------------------------------------------------------------------------
| Get Active Templates For Event
|--------------------------------------------------------------------------
*/

export const getActiveNotificationTemplatesForEvent =
    async (
        event: string,
    ) => {
        return NotificationTemplate.find({
            event: normalizeEvent(event),
            status:
                NOTIFICATION_TEMPLATE_STATUSES.ACTIVE,
        })
            .sort({
                locale: 1,
                channel: 1,
            })
            .lean();
    };

/*
|--------------------------------------------------------------------------
| Count
|--------------------------------------------------------------------------
*/

export const countNotificationTemplates = async (
    filter: {
        readonly status?: NotificationTemplateStatus;
        readonly event?: string;
        readonly channel?: NotificationTemplateChannel;
    } = {},
) => {
    const query: Record<string, unknown> = {};

    if (filter.status) {
        query.status = filter.status;
    }

    if (filter.event) {
        query.event = normalizeEvent(filter.event);
    }

    if (filter.channel) {
        query.channel = filter.channel;
    }

    return NotificationTemplate.countDocuments(query);
};
