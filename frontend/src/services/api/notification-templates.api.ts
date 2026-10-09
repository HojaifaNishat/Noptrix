import apiClient from "./client";

import type {
    ApiResponse,
} from "@/types/api";

import type {
    CreateNotificationTemplateInput,
    NotificationTemplate,
    NotificationTemplateListResponse,
    NotificationTemplateQuery,
    UpdateNotificationTemplateInput,
} from "@/features/notification-templates/notification-template.types";

const BASE_PATH = "/notification-templates";

/*
|--------------------------------------------------------------------------
| Backend List Response
|--------------------------------------------------------------------------
|
| Backend returns:
|
| {
|     success: true,
|     message: "...",
|     data: NotificationTemplate[],
|     pagination: {...}
| }
|
*/

interface NotificationTemplateListApiResponse
    extends ApiResponse<NotificationTemplate[]> {
    pagination: NotificationTemplateListResponse["pagination"];
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeId = (
    templateId: string,
): string => {
    const value = templateId.trim();

    if (!value) {
        throw new Error(
            "Notification template ID is required.",
        );
    }

    return encodeURIComponent(value);
};

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const notificationTemplatesApi = {
    /*
    |--------------------------------------------------------------------------
    | List
    |--------------------------------------------------------------------------
    */

    async getAll(
        params?: NotificationTemplateQuery,
    ): Promise<NotificationTemplateListResponse> {
        const response =
            await apiClient.get<NotificationTemplateListApiResponse>(
                BASE_PATH,
                {
                    params,
                },
            );

        return {
            items: Array.isArray(
                response.data.data,
            )
                ? response.data.data
                : [],

            pagination:
                response.data.pagination ?? {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 20,
                    total: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Get By ID
    |--------------------------------------------------------------------------
    */

    async getById(
        templateId: string,
    ): Promise<NotificationTemplate> {
        const response =
            await apiClient.get<
                ApiResponse<NotificationTemplate>
            >(
                `${BASE_PATH}/${normalizeId(
                    templateId,
                )}`,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    async create(
        input: CreateNotificationTemplateInput,
    ): Promise<NotificationTemplate> {
        const response =
            await apiClient.post<
                ApiResponse<NotificationTemplate>
            >(
                BASE_PATH,
                input,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    async update(
        templateId: string,
        input: UpdateNotificationTemplateInput,
    ): Promise<NotificationTemplate> {
        const response =
            await apiClient.patch<
                ApiResponse<NotificationTemplate>
            >(
                `${BASE_PATH}/${normalizeId(
                    templateId,
                )}`,
                input,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Activate
    |--------------------------------------------------------------------------
    */

    async activate(
        templateId: string,
    ): Promise<NotificationTemplate> {
        const response =
            await apiClient.post<
                ApiResponse<NotificationTemplate>
            >(
                `${BASE_PATH}/${normalizeId(
                    templateId,
                )}/activate`,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Deactivate
    |--------------------------------------------------------------------------
    */

    async deactivate(
        templateId: string,
    ): Promise<NotificationTemplate> {
        const response =
            await apiClient.post<
                ApiResponse<NotificationTemplate>
            >(
                `${BASE_PATH}/${normalizeId(
                    templateId,
                )}/deactivate`,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    async remove(
        templateId: string,
    ): Promise<void> {
        await apiClient.delete<
            ApiResponse<unknown>
        >(
            `${BASE_PATH}/${normalizeId(
                templateId,
            )}`,
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Active Templates By Event
    |--------------------------------------------------------------------------
    */

    async getActiveByEvent(
        event: string,
    ): Promise<NotificationTemplate[]> {
        const normalizedEvent =
            event.trim();

        if (!normalizedEvent) {
            throw new Error(
                "Event is required.",
            );
        }

        const response =
            await apiClient.get<
                ApiResponse<NotificationTemplate[]>
            >(
                `${BASE_PATH}/event/${encodeURIComponent(
                    normalizedEvent,
                )}/active`,
            );

        return response.data.data;
    },
};

/*
|--------------------------------------------------------------------------
| Named Exports
|--------------------------------------------------------------------------
*/

export const getNotificationTemplates =
    notificationTemplatesApi.getAll;

export const getNotificationTemplate =
    notificationTemplatesApi.getById;

export const createNotificationTemplate =
    notificationTemplatesApi.create;

export const updateNotificationTemplate =
    notificationTemplatesApi.update;

export const activateNotificationTemplate =
    notificationTemplatesApi.activate;

export const deactivateNotificationTemplate =
    notificationTemplatesApi.deactivate;

export const deleteNotificationTemplate =
    notificationTemplatesApi.remove;

export default notificationTemplatesApi;
