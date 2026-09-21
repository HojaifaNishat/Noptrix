import {
    Router,
} from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createRoleController,
    getAllRolesController,
    getRoleController,
    updateRoleController,
    activateRoleController,
    deactivateRoleController,
    deleteRoleController,
} from "./role.controller";

import {
    z,
} from "zod";

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

const roleIdParamSchema =
    z.object({
        roleId: z
            .string()
            .trim()
            .min(
                1,
                "Role ID is required."
            ),
    });

const createRoleSchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Role name must be at least 2 characters."
            )
            .max(
                100,
                "Role name cannot exceed 100 characters."
            ),

        slug: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Role slug can only contain lowercase letters, numbers, and hyphens."
            ),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Role description cannot exceed 500 characters."
            )
            .optional(),

        isSystemRole: z
            .boolean()
            .optional(),
    });

const updateRoleSchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Role name must be at least 2 characters."
            )
            .max(
                100,
                "Role name cannot exceed 100 characters."
            )
            .optional(),

        slug: z
            .string()
            .trim()
            .toLowerCase()
            .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Role slug can only contain lowercase letters, numbers, and hyphens."
            )
            .optional(),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Role description cannot exceed 500 characters."
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
| Role Routes
|--------------------------------------------------------------------------
*/

/**
 * Create role
 *
 * POST /api/roles
 */
router.post(
    "/",
    userAuth,
    validate(
        createRoleSchema,
        "body"
    ),
    createRoleController
);

/**
 * Get all roles
 *
 * GET /api/roles
 */
router.get(
    "/",
    userAuth,
    getAllRolesController
);

/**
 * Get role by ID
 *
 * GET /api/roles/:roleId
 */
router.get(
    "/:roleId",
    userAuth,
    validate(
        roleIdParamSchema,
        "params"
    ),
    getRoleController
);

/**
 * Update role
 *
 * PATCH /api/roles/:roleId
 */
router.patch(
    "/:roleId",
    userAuth,
    validate(
        roleIdParamSchema,
        "params"
    ),
    validate(
        updateRoleSchema,
        "body"
    ),
    updateRoleController
);

/**
 * Activate role
 *
 * PATCH /api/roles/:roleId/activate
 */
router.patch(
    "/:roleId/activate",
    userAuth,
    validate(
        roleIdParamSchema,
        "params"
    ),
    activateRoleController
);

/**
 * Deactivate role
 *
 * PATCH /api/roles/:roleId/deactivate
 */
router.patch(
    "/:roleId/deactivate",
    userAuth,
    validate(
        roleIdParamSchema,
        "params"
    ),
    deactivateRoleController
);

/**
 * Delete role
 *
 * DELETE /api/roles/:roleId
 */
router.delete(
    "/:roleId",
    userAuth,
    validate(
        roleIdParamSchema,
        "params"
    ),
    deleteRoleController
);

export default router;