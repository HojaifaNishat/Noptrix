import {
    Router,
} from "express";

import {
    z,
} from "zod";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createPermissionController,
    getAllPermissionsController,
    getPermissionController,
    updatePermissionController,
    activatePermissionController,
    deactivatePermissionController,
    deletePermissionController,
} from "./permission.controller";

import {
    PERMISSION_ACTIONS,
} from "./permission.model";

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

const permissionIdParamSchema =
    z.object({
        permissionId: z
            .string()
            .trim()
            .min(
                1,
                "Permission ID is required."
            ),
    });

const createPermissionSchema =
    z.object({
        resource: z
            .string()
            .trim()
            .toLowerCase()
            .min(
                2,
                "Permission resource must be at least 2 characters."
            )
            .max(
                100,
                "Permission resource cannot exceed 100 characters."
            )
            .regex(
                /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
                "Permission resource contains invalid characters."
            ),

        action: z.enum(
            Object.values(
                PERMISSION_ACTIONS
            ) as [
                string,
                ...string[],
            ]
        ),

        key: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                /^[a-z0-9]+(?:[-_][a-z0-9]+)*\.[a-z]+$/,
                "Permission key must follow the format resource.action."
            ),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Permission description cannot exceed 500 characters."
            )
            .optional(),

        isSystemPermission:
            z.boolean().optional(),
    });

const updatePermissionSchema =
    z.object({
        resource: z
            .string()
            .trim()
            .toLowerCase()
            .min(
                2,
                "Permission resource must be at least 2 characters."
            )
            .max(
                100,
                "Permission resource cannot exceed 100 characters."
            )
            .regex(
                /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
                "Permission resource contains invalid characters."
            )
            .optional(),

        action: z.enum(
            Object.values(
                PERMISSION_ACTIONS
            ) as [
                string,
                ...string[],
            ]
        ).optional(),

        key: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                /^[a-z0-9]+(?:[-_][a-z0-9]+)*\.[a-z]+$/,
                "Permission key must follow the format resource.action."
            )
            .optional(),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Permission description cannot exceed 500 characters."
            )
            .optional(),

        status: z
            .enum([
                "ACTIVE",
                "INACTIVE",
            ])
            .optional(),
    }).refine(
        (data) =>
            Object.keys(data).length > 0,
        {
            message:
                "At least one field is required.",
        }
    );

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

const router =
    Router();

/*
|--------------------------------------------------------------------------
| Permission Routes
|--------------------------------------------------------------------------
*/

/**
 * Create permission
 *
 * POST /api/permissions
 */
router.post(
    "/",
    userAuth,
    validate(
        createPermissionSchema,
        "body"
    ),
    createPermissionController
);

/**
 * Get all permissions
 *
 * GET /api/permissions
 */
router.get(
    "/",
    userAuth,
    getAllPermissionsController
);

/**
 * Get permission by ID
 *
 * GET /api/permissions/:permissionId
 */
router.get(
    "/:permissionId",
    userAuth,
    validate(
        permissionIdParamSchema,
        "params"
    ),
    getPermissionController
);

/**
 * Update permission
 *
 * PATCH /api/permissions/:permissionId
 */
router.patch(
    "/:permissionId",
    userAuth,
    validate(
        permissionIdParamSchema,
        "params"
    ),
    validate(
        updatePermissionSchema,
        "body"
    ),
    updatePermissionController
);

/**
 * Activate permission
 *
 * PATCH /api/permissions/:permissionId/activate
 */
router.patch(
    "/:permissionId/activate",
    userAuth,
    validate(
        permissionIdParamSchema,
        "params"
    ),
    activatePermissionController
);

/**
 * Deactivate permission
 *
 * PATCH /api/permissions/:permissionId/deactivate
 */
router.patch(
    "/:permissionId/deactivate",
    userAuth,
    validate(
        permissionIdParamSchema,
        "params"
    ),
    deactivatePermissionController
);

/**
 * Delete permission
 *
 * DELETE /api/permissions/:permissionId
 */
router.delete(
    "/:permissionId",
    userAuth,
    validate(
        permissionIdParamSchema,
        "params"
    ),
    deletePermissionController
);

export default router;