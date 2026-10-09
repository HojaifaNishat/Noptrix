export const NOTIFICATION_TEMPLATE_STATUSES = [
    "ACTIVE",
    "INACTIVE",
] as const;

export type NotificationTemplateStatus =
    (typeof NOTIFICATION_TEMPLATE_STATUSES)[number];

export const NOTIFICATION_TEMPLATE_CHANNELS = [
    "in-app",
    "email",
    "push",
    "sms",
] as const;

export type NotificationTemplateChannel =
    (typeof NOTIFICATION_TEMPLATE_CHANNELS)[number];

export interface NotificationTemplate {
    _id: string;
    key: string;
    name: string;
    description?: string;
    event: string;
    channel: NotificationTemplateChannel;
    locale: string;
    title: string;
    body: string;
    status: NotificationTemplateStatus;
    variables: string[];
    createdBy?: string | Record<string, unknown>;
    updatedBy?: string | Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotificationTemplateInput {
    key: string;
    name: string;
    description?: string;
    event: string;
    channel: NotificationTemplateChannel;
    locale: string;
    title: string;
    body: string;
    status?: NotificationTemplateStatus;
    variables: string[];
}

export interface UpdateNotificationTemplateInput {
    name?: string;
    description?: string | null;
    event?: string;
    channel?: NotificationTemplateChannel;
    locale?: string;
    title?: string;
    body?: string;
    status?: NotificationTemplateStatus;
    variables?: string[];
}

export interface NotificationTemplateQuery {
    key?: string;
    event?: string;
    channel?: NotificationTemplateChannel;
    locale?: string;
    status?: NotificationTemplateStatus;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "updatedAt" | "name" | "key" | "event";
    sortOrder?: "asc" | "desc";
}

export interface NotificationTemplatePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface NotificationTemplateListResponse {
    items: NotificationTemplate[];
    pagination: NotificationTemplatePagination;
}

export interface NotificationTemplateFormValues {
    key: string;
    name: string;
    description: string;
    event: string;
    channel: NotificationTemplateChannel;
    locale: string;
    title: string;
    body: string;
    status: NotificationTemplateStatus;
    variables: string[];
}
