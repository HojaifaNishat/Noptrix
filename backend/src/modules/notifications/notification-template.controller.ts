import {
    Request,
    Response,
} from "express";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";

import {
    createNotificationTemplate,
    getNotificationTemplateById,
    listNotificationTemplates,
    updateNotificationTemplate,
    activateNotificationTemplate,
    deactivateNotificationTemplate,
    deleteNotificationTemplate,
    getActiveNotificationTemplatesForEvent,
} from "./notification-template.service";

import {
    CreateNotificationTemplateInput,
    NotificationTemplateQueryInput,
    UpdateNotificationTemplateInput,
} from "./notification-template.validator";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getAdminId = (req: Request): string => {
    const adminId = getAuthenticatedAdminId(req);

    if (!adminId) {
        throw ApiError.unauthorized(
            "Authenticated admin is required.",
        );
    }

    return adminId;
};

const getParam = (
    req: Request,
    name: string,
): string => {
    const value = req.params[name];

    if (typeof value !== "string" || !value.trim()) {
        throw ApiError.badRequest(
            `Invalid ${name}.`,
        );
    }

    return value;
};

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export const createNotificationTemplateController = async (
    req: Request,
    res: Response,
) => {
    const adminId = getAdminId(req);

    const template = await createNotificationTemplate(
        adminId,
        req.body as CreateNotificationTemplateInput,
    );

    res.status(201).json({
        success: true,
        message: "Notification template created successfully.",
        data: template,
    });
};

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/

export const getNotificationTemplateController = async (
    req: Request,
    res: Response,
) => {
    const template = await getNotificationTemplateById(
        getParam(req, "templateId"),
    );

    res.status(200).json({
        success: true,
        message: "Notification template retrieved successfully.",
        data: template,
    });
};

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

export const listNotificationTemplatesController = async (
    req: Request,
    res: Response,
) => {
    const result = await listNotificationTemplates(
        req.query as unknown as NotificationTemplateQueryInput,
    );

    res.status(200).json({
        success: true,
        message: "Notification templates retrieved successfully.",
        data: result.items,
        pagination: result.pagination,
    });
};

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export const updateNotificationTemplateController = async (
    req: Request,
    res: Response,
) => {
    const adminId = getAdminId(req);

    const template = await updateNotificationTemplate(
        getParam(req, "templateId"),
        adminId,
        req.body as UpdateNotificationTemplateInput,
    );

    res.status(200).json({
        success: true,
        message: "Notification template updated successfully.",
        data: template,
    });
};

/*
|--------------------------------------------------------------------------
| Activate
|--------------------------------------------------------------------------
*/

export const activateNotificationTemplateController = async (
    req: Request,
    res: Response,
) => {
    const adminId = getAdminId(req);

    const template =
        await activateNotificationTemplate(
            getParam(req, "templateId"),
            adminId,
        );

    res.status(200).json({
        success: true,
        message: "Notification template activated successfully.",
        data: template,
    });
};

/*
|--------------------------------------------------------------------------
| Deactivate
|--------------------------------------------------------------------------
*/

export const deactivateNotificationTemplateController = async (
    req: Request,
    res: Response,
) => {
    const adminId = getAdminId(req);

    const template =
        await deactivateNotificationTemplate(
            getParam(req, "templateId"),
            adminId,
        );

    res.status(200).json({
        success: true,
        message: "Notification template deactivated successfully.",
        data: template,
    });
};

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export const deleteNotificationTemplateController = async (
    req: Request,
    res: Response,
) => {
    const result =
        await deleteNotificationTemplate(
            getParam(req, "templateId"),
        );

    res.status(200).json({
        success: true,
        message: "Notification template deleted successfully.",
        data: result,
    });
};

/*
|--------------------------------------------------------------------------
| Active Templates By Event
|--------------------------------------------------------------------------
*/

export const getActiveNotificationTemplatesForEventController =
    async (
        req: Request,
        res: Response,
    ) => {
        const templates =
            await getActiveNotificationTemplatesForEvent(
                getParam(req, "event"),
            );

        res.status(200).json({
            success: true,
            message:
                "Active notification templates retrieved successfully.",
            data: templates,
        });
    };
