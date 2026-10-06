import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    createAnnouncement,
    getAnnouncementById,
    getAnnouncements,
    updateAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    getMyAnnouncements,
    getMyAnnouncementById,
    markAnnouncementAsRead,
    dismissAnnouncement,
} from "./announcement.service";

import {
    ANNOUNCEMENT_PRIORITIES,
    ANNOUNCEMENT_TARGET_TYPES,
    ANNOUNCEMENT_STATUSES,
    type AnnouncementPriority,
    type AnnouncementTargetType,
    type AnnouncementStatus,
} from "./announcement.types";

import {
    getAuthenticatedAdminId,
} from "../../../middlewares/adminAuth.middleware";

import {
    getAuthenticatedOwnerId,
} from "../../../middlewares/ownerAuth.middleware";

import {
    ApiError,
} from "../../../utils/ApiError";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getAuthenticatedAdministrativeUserId(
    req: Request,
): string {
    try {
        return getAuthenticatedOwnerId(req);
    } catch {
        try {
            return getAuthenticatedAdminId(req);
        } catch {
            throw ApiError.unauthorized(
                "Authenticated administrative user is required.",
            );
        }
    }
}

function parsePositiveInteger(
    value: unknown,
    fallback: number,
): number {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
}

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export async function createAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const createdBy =
            getAuthenticatedAdministrativeUserId(req);

        const announcement =
            await createAnnouncement(
                createdBy,
                {
                    title: req.body.title,
                    body: req.body.body,
                    priority:
                        req.body.priority as
                            | AnnouncementPriority
                            | undefined,
                    targetType:
                        req.body.targetType as
                            AnnouncementTargetType,
                    targetRoleIds:
                        req.body.targetRoleIds,
                    targetUserIds:
                        req.body.targetUserIds,
                    scheduledAt: req.body.scheduledAt
                        ? new Date(req.body.scheduledAt)
                        : undefined,
                    expiresAt: req.body.expiresAt
                        ? new Date(req.body.expiresAt)
                        : undefined,
                    attachments:
                        req.body.attachments,
                },
            );

        res.status(201).json({
            success: true,
            message: "Announcement created successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

export async function getAnnouncementsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        getAuthenticatedAdministrativeUserId(req);

        const result = await getAnnouncements({
            page: parsePositiveInteger(
                req.query.page,
                1,
            ),
            limit: parsePositiveInteger(
                req.query.limit,
                20,
            ),
            status:
                typeof req.query.status === "string"
                    ? req.query.status as AnnouncementStatus
                    : undefined,
            priority:
                typeof req.query.priority === "string"
                    ? req.query.priority as AnnouncementPriority
                    : undefined,
            targetType:
                typeof req.query.targetType === "string"
                    ? req.query.targetType as AnnouncementTargetType
                    : undefined,
            search:
                typeof req.query.search === "string"
                    ? req.query.search
                    : undefined,
        });

        res.status(200).json({
            success: true,
            message: "Announcements retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/

export async function getAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        getAuthenticatedAdministrativeUserId(req);

        const announcement =
            await getAnnouncementById(
                String(req.params.announcementId),
            );

        res.status(200).json({
            success: true,
            message: "Announcement retrieved successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export async function updateAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const updatedBy =
            getAuthenticatedAdministrativeUserId(req);

        const announcement =
            await updateAnnouncement(
                String(req.params.announcementId),
                updatedBy,
                {
                    title: req.body.title,
                    body: req.body.body,
                    priority:
                        req.body.priority as
                            | AnnouncementPriority
                            | undefined,
                    targetType:
                        req.body.targetType as
                            | AnnouncementTargetType
                            | undefined,
                    targetRoleIds:
                        req.body.targetRoleIds,
                    targetUserIds:
                        req.body.targetUserIds,
                    scheduledAt:
                        req.body.scheduledAt !== undefined
                            ? new Date(req.body.scheduledAt)
                            : undefined,
                    expiresAt:
                        req.body.expiresAt !== undefined
                            ? new Date(req.body.expiresAt)
                            : undefined,
                    attachments:
                        req.body.attachments,
                },
            );

        res.status(200).json({
            success: true,
            message: "Announcement updated successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Publish
|--------------------------------------------------------------------------
*/

export async function publishAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const updatedBy =
            getAuthenticatedAdministrativeUserId(req);

        const announcement =
            await publishAnnouncement(
                String(req.params.announcementId),
                updatedBy,
            );

        res.status(200).json({
            success: true,
            message: "Announcement published successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Archive
|--------------------------------------------------------------------------
*/

export async function archiveAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const updatedBy =
            getAuthenticatedAdministrativeUserId(req);

        const announcement =
            await archiveAnnouncement(
                String(req.params.announcementId),
                updatedBy,
            );

        res.status(200).json({
            success: true,
            message: "Announcement archived successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| My Announcements
|--------------------------------------------------------------------------
*/

export async function getMyAnnouncementsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId =
            getAuthenticatedAdministrativeUserId(req);

        const result =
            await getMyAnnouncements({
                userId,
                page: parsePositiveInteger(
                    req.query.page,
                    1,
                ),
                limit: parsePositiveInteger(
                    req.query.limit,
                    20,
                ),
                unreadOnly:
                    req.query.unreadOnly === "true",
            });

        res.status(200).json({
            success: true,
            message: "Your announcements retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| My Announcement By ID
|--------------------------------------------------------------------------
*/

export async function getMyAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId =
            getAuthenticatedAdministrativeUserId(req);

        const result =
            await getMyAnnouncementById(
                String(req.params.announcementId),
                userId,
            );

        res.status(200).json({
            success: true,
            message: "Announcement retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Mark As Read
|--------------------------------------------------------------------------
*/

export async function markAnnouncementAsReadController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId =
            getAuthenticatedAdministrativeUserId(req);

        const result =
            await markAnnouncementAsRead(
                String(req.params.announcementId),
                userId,
            );

        res.status(200).json({
            success: true,
            message: "Announcement marked as read.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Dismiss
|--------------------------------------------------------------------------
*/

export async function dismissAnnouncementController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId =
            getAuthenticatedAdministrativeUserId(req);

        const result =
            await dismissAnnouncement(
                String(req.params.announcementId),
                userId,
            );

        res.status(200).json({
            success: true,
            message: "Announcement dismissed successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Keep constants referenced
|--------------------------------------------------------------------------
|
| These references intentionally keep the controller aligned with
| the announcement domain constants without duplicating values.
|--------------------------------------------------------------------------
*/

void ANNOUNCEMENT_PRIORITIES;
void ANNOUNCEMENT_TARGET_TYPES;
void ANNOUNCEMENT_STATUSES;
