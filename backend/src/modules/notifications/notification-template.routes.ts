import {
    Router,
} from "express";

import {
    adminAuth,
} from "../../middlewares/adminAuth.middleware";

import {
    requirePermission,
} from "../../middlewares/permission.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    createNotificationTemplateController,
    getNotificationTemplateController,
    listNotificationTemplatesController,
    updateNotificationTemplateController,
    activateNotificationTemplateController,
    deactivateNotificationTemplateController,
    deleteNotificationTemplateController,
    getActiveNotificationTemplatesForEventController,
} from "./notification-template.controller";

import {
    createNotificationTemplateSchema,
    updateNotificationTemplateSchema,
    notificationTemplateQuerySchema,
    notificationTemplateIdParamSchema,
} from "./notification-template.validator";

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

const router = Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Every notification-template management endpoint requires
| authenticated ADMIN access.
|
*/

router.use(
    adminAuth,
);

/*
|--------------------------------------------------------------------------
| List Templates
|--------------------------------------------------------------------------
|
| GET /notification-templates
|
*/

router.get(
    "/",
    requirePermission("notification_templates.read"),
    validate(
        notificationTemplateQuerySchema,
        "query",
    ),
    asyncHandler(
        listNotificationTemplatesController,
    ),
);

/*
|--------------------------------------------------------------------------
| Create Template
|--------------------------------------------------------------------------
|
| POST /notification-templates
|
*/

router.post(
    "/",
    requirePermission("notification_templates.create"),
    validate(
        createNotificationTemplateSchema,
        "body",
    ),
    asyncHandler(
        createNotificationTemplateController,
    ),
);

/*
|--------------------------------------------------------------------------
| Active Templates By Event
|--------------------------------------------------------------------------
|
| Internal/admin inspection endpoint.
|
| GET /notification-templates/event/:event/active
|
*/

router.get(
    "/event/:event/active",
    requirePermission("notification_templates.read"),
    asyncHandler(
        getActiveNotificationTemplatesForEventController,
    ),
);

/*
|--------------------------------------------------------------------------
| Get Template
|--------------------------------------------------------------------------
|
| GET /notification-templates/:templateId
|
*/

router.get(
    "/:templateId",
    requirePermission("notification_templates.read"),
    validate(
        notificationTemplateIdParamSchema,
        "params",
    ),
    asyncHandler(
        getNotificationTemplateController,
    ),
);

/*
|--------------------------------------------------------------------------
| Update Template
|--------------------------------------------------------------------------
|
| PATCH /notification-templates/:templateId
|
*/

router.patch(
    "/:templateId",
    requirePermission("notification_templates.update"),
    validate(
        notificationTemplateIdParamSchema,
        "params",
    ),
    validate(
        updateNotificationTemplateSchema,
        "body",
    ),
    asyncHandler(
        updateNotificationTemplateController,
    ),
);

/*
|--------------------------------------------------------------------------
| Activate Template
|--------------------------------------------------------------------------
|
| POST /notification-templates/:templateId/activate
|
*/

router.post(
    "/:templateId/activate",
    requirePermission("notification_templates.update"),
    validate(
        notificationTemplateIdParamSchema,
        "params",
    ),
    asyncHandler(
        activateNotificationTemplateController,
    ),
);

/*
|--------------------------------------------------------------------------
| Deactivate Template
|--------------------------------------------------------------------------
|
| POST /notification-templates/:templateId/deactivate
|
*/

router.post(
    "/:templateId/deactivate",
    requirePermission("notification_templates.update"),
    validate(
        notificationTemplateIdParamSchema,
        "params",
    ),
    asyncHandler(
        deactivateNotificationTemplateController,
    ),
);

/*
|--------------------------------------------------------------------------
| Delete Template
|--------------------------------------------------------------------------
|
| DELETE /notification-templates/:templateId
|
*/

router.delete(
    "/:templateId",
    requirePermission("notification_templates.delete"),
    validate(
        notificationTemplateIdParamSchema,
        "params",
    ),
    asyncHandler(
        deleteNotificationTemplateController,
    ),
);

export default router;
