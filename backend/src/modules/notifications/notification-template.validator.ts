import { z } from "zod";

import {
    NOTIFICATION_TEMPLATE_CHANNELS,
    NOTIFICATION_TEMPLATE_STATUSES,
} from "./notification-template.model";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const templateChannels = Object.values(
    NOTIFICATION_TEMPLATE_CHANNELS,
) as [string, ...string[]];

const templateStatuses = Object.values(
    NOTIFICATION_TEMPLATE_STATUSES,
) as [string, ...string[]];

/*
|--------------------------------------------------------------------------
| Shared Fields
|--------------------------------------------------------------------------
*/

const templateKeySchema = z
    .string()
    .trim()
    .min(2, "Template key must contain at least 2 characters.")
    .max(150, "Template key must not exceed 150 characters.")
    .regex(
        /^[a-z0-9._-]+$/,
        "Template key may contain only lowercase letters, numbers, dots, underscores, and hyphens.",
    );

const templateNameSchema = z
    .string()
    .trim()
    .min(2, "Template name must contain at least 2 characters.")
    .max(200, "Template name must not exceed 200 characters.");

const eventSchema = z
    .string()
    .trim()
    .min(2, "Event must contain at least 2 characters.")
    .max(100, "Event must not exceed 100 characters.")
    .regex(
        /^[A-Z0-9._-]+$/,
        "Event must use uppercase letters, numbers, dots, underscores, and hyphens.",
    );

const localeSchema = z
    .string()
    .trim()
    .min(2, "Locale must contain at least 2 characters.")
    .max(20, "Locale must not exceed 20 characters.")
    .regex(
        /^[a-z]{2}(?:-[A-Z]{2})?$/,
        "Locale must use a valid format such as en or en-US.",
    );

const channelSchema = z.enum(templateChannels as [
    (typeof NOTIFICATION_TEMPLATE_CHANNELS)[keyof typeof NOTIFICATION_TEMPLATE_CHANNELS],
    ...(typeof NOTIFICATION_TEMPLATE_CHANNELS)[keyof typeof NOTIFICATION_TEMPLATE_CHANNELS][],
]);

const statusSchema = z.enum(templateStatuses as [
    (typeof NOTIFICATION_TEMPLATE_STATUSES)[keyof typeof NOTIFICATION_TEMPLATE_STATUSES],
    ...(typeof NOTIFICATION_TEMPLATE_STATUSES)[keyof typeof NOTIFICATION_TEMPLATE_STATUSES][],
]);

const variablesSchema = z
    .array(
        z
            .string()
            .trim()
            .min(1, "Template variable cannot be empty.")
            .max(100, "Template variable must not exceed 100 characters.")
            .regex(
                /^[a-zA-Z0-9_.-]+$/,
                "Template variable may contain only letters, numbers, dots, underscores, and hyphens.",
            ),
    )
    .max(50, "A template cannot contain more than 50 variables.")
    .default([]);

/*
|--------------------------------------------------------------------------
| Create Template
|--------------------------------------------------------------------------
*/

export const createNotificationTemplateSchema = z
    .object({
        key: templateKeySchema,

        name: templateNameSchema,

        description: z
            .string()
            .trim()
            .max(1000, "Description must not exceed 1000 characters.")
            .optional(),

        event: eventSchema,

        channel: channelSchema,

        locale: localeSchema.default("en"),

        title: z
            .string()
            .trim()
            .min(1, "Template title is required.")
            .max(300, "Template title must not exceed 300 characters."),

        body: z
            .string()
            .trim()
            .min(1, "Template body is required.")
            .max(5000, "Template body must not exceed 5000 characters."),

        status: statusSchema.optional(),

        variables: variablesSchema,
    })
    .strict();

/*
|--------------------------------------------------------------------------
| Update Template
|--------------------------------------------------------------------------
*/

export const updateNotificationTemplateSchema = z
    .object({
        name: templateNameSchema.optional(),

        description: z
            .string()
            .trim()
            .max(1000, "Description must not exceed 1000 characters.")
            .nullable()
            .optional(),

        event: eventSchema.optional(),

        channel: channelSchema.optional(),

        locale: localeSchema.optional(),

        title: z
            .string()
            .trim()
            .min(1, "Template title is required.")
            .max(300, "Template title must not exceed 300 characters.")
            .optional(),

        body: z
            .string()
            .trim()
            .min(1, "Template body is required.")
            .max(5000, "Template body must not exceed 5000 characters.")
            .optional(),

        status: statusSchema.optional(),

        variables: variablesSchema.optional(),
    })
    .strict()
    .refine(
        (value) => Object.keys(value).length > 0,
        {
            message: "At least one field must be provided for update.",
        },
    );

/*
|--------------------------------------------------------------------------
| Query
|--------------------------------------------------------------------------
*/

export const notificationTemplateQuerySchema = z
    .object({
        key: templateKeySchema.optional(),

        event: eventSchema.optional(),

        channel: channelSchema.optional(),

        locale: localeSchema.optional(),

        status: statusSchema.optional(),

        search: z
            .string()
            .trim()
            .max(200, "Search must not exceed 200 characters.")
            .optional(),

        page: z.coerce
            .number()
            .int()
            .min(1)
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20),

        sortBy: z
            .enum([
                "createdAt",
                "updatedAt",
                "name",
                "key",
                "event",
            ])
            .default("updatedAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    })
    .strict();

/*
|--------------------------------------------------------------------------
| Params
|--------------------------------------------------------------------------
*/

export const notificationTemplateIdParamSchema = z
    .object({
        templateId: z
            .string()
            .trim()
            .regex(
                /^[a-fA-F0-9]{24}$/,
                "Invalid notification template ID.",
            ),
    })
    .strict();

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateNotificationTemplateInput = z.infer<
    typeof createNotificationTemplateSchema
>;

export type UpdateNotificationTemplateInput = z.infer<
    typeof updateNotificationTemplateSchema
>;

export type NotificationTemplateQueryInput = z.infer<
    typeof notificationTemplateQuerySchema
>;
