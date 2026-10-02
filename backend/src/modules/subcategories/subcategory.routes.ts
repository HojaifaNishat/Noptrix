import {
    Router,
    type RequestHandler,
} from "express";

import {
    adminAuth,
    adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import {
    hasPermissionMatch,
} from "../../middlewares/permission.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    uploadSingleImage,
} from "../../middlewares/upload.middleware";

import {
    createSubcategoryController,
    getSubcategoryController,
    getSubcategoryBySlugController,
    listSubcategoriesController,
    listActiveSubcategoriesController,
    updateSubcategoryController,
    updateSubcategoryStatusController,
    updateSubcategoryFeaturedController,
    updateSubcategorySortOrderController,
    deleteSubcategoryController,
} from "./subcategory.controller";

import {
    createSubcategorySchema,
    updateSubcategorySchema,
    subcategoryIdParamSchema,
    subcategorySlugParamSchema,
    subcategoryListQuerySchema,
    updateSubcategoryStatusSchema,
    updateSubcategoryFeaturedSchema,
    updateSubcategorySortOrderSchema,
} from "./subcategory.validator";

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

const router = Router();

/*
|--------------------------------------------------------------------------
| Subcategory Permissions
|--------------------------------------------------------------------------
|
| OWNER
|   → Full subcategory access automatically.
|
| ADMIN
|   → Access is controlled by RolePermission.
|
| Supported permissions:
|
| subcategories.read
| subcategories.create
| subcategories.update
| subcategories.delete
|
| Wildcards:
|
| subcategories.*
| *
|
|--------------------------------------------------------------------------
*/

const requireSubcategoryPermission =
    (
        permission: string
    ): RequestHandler => {
        return (
            req,
            res,
            next
        ) => {
            /*
            |--------------------------------------------------------------------------
            | Admin Authentication
            |--------------------------------------------------------------------------
            */

            const admin =
                req.adminAuth;

            if (!admin?.adminId) {
                res.status(401).json({
                    success: false,
                    message:
                        "Admin authentication required.",
                });

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | OWNER Access
            |--------------------------------------------------------------------------
            |
            | OWNER has system-wide access.
            | No RolePermission lookup is required.
            |
            */

            if (
                admin.role
                    ?.trim()
                    .toUpperCase() ===
                "OWNER"
            ) {
                next();
                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Attach Admin Permissions
            |--------------------------------------------------------------------------
            |
            | Admin authentication stores resolved permissions
            | inside req.adminAuth.permissions.
            |
            | Generic permission helpers read req.permissions.
            |
            */

            req.permissions =
                Object.freeze([
                    ...(admin.permissions ??
                        []),
                ]);

            /*
            |--------------------------------------------------------------------------
            | Permission Check
            |--------------------------------------------------------------------------
            */

            if (
                !hasPermissionMatch(
                    req,
                    permission
                )
            ) {
                res.status(403).json({
                    success: false,
                    message:
                        "You do not have permission to perform this action.",
                    code:
                        "SUBCATEGORY_PERMISSION_DENIED",
                });

                return;
            }

            next();
        };
    };

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| All administrative subcategory mutations/read-by-ID
| require:
|
| adminAuth
|   → Valid administrative access token
|
| adminSecretVerified
|   → Completed admin secret verification
|
|--------------------------------------------------------------------------
*/

const adminOnly = [
    adminAuth,
    adminSecretVerified,
];

/*
|--------------------------------------------------------------------------
| Public Read Access
|--------------------------------------------------------------------------
|
| These endpoints are intentionally public.
|
| GET /api/subcategories
| GET /api/subcategories/active
| GET /api/subcategories/slug/:slug
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| List Subcategories
|--------------------------------------------------------------------------
|
| GET /api/subcategories
|
| Optional filters:
|
| categoryId
| search
| status
| isFeatured
| page
| limit
| sortBy
| sortOrder
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    validate(
        subcategoryListQuerySchema,
        "query"
    ),
    listSubcategoriesController
);

/*
|--------------------------------------------------------------------------
| List Active Subcategories
|--------------------------------------------------------------------------
|
| GET /api/subcategories/active
|
| Optional:
|
| ?categoryId=<categoryId>
|
|--------------------------------------------------------------------------
*/

router.get(
    "/active",
    listActiveSubcategoriesController
);

/*
|--------------------------------------------------------------------------
| Get Subcategory By Slug
|--------------------------------------------------------------------------
|
| GET /api/subcategories/slug/:slug
|
|--------------------------------------------------------------------------
*/

router.get(
    "/slug/:slug",
    validate(
        subcategorySlugParamSchema,
        "params"
    ),
    getSubcategoryBySlugController
);

/*
|--------------------------------------------------------------------------
| Create Subcategory
|--------------------------------------------------------------------------
|
| POST /api/subcategories
|
| multipart/form-data
|
| Fields:
|
| categoryId
| name
| slug
| description
| status
| isFeatured
| sortOrder
| seo
| image
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.create"
    ),
    uploadSingleImage,
    validate(
        createSubcategorySchema,
        "body"
    ),
    createSubcategoryController
);

/*
|--------------------------------------------------------------------------
| Get Subcategory By ID
|--------------------------------------------------------------------------
|
| GET /api/subcategories/:subcategoryId
|
| Admin read endpoint.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:subcategoryId",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.read"
    ),
    validate(
        subcategoryIdParamSchema,
        "params"
    ),
    getSubcategoryController
);

/*
|--------------------------------------------------------------------------
| Update Subcategory
|--------------------------------------------------------------------------
|
| PATCH /api/subcategories/:subcategoryId
|
| multipart/form-data
|
| image field:
|   image
|
| remove existing image:
|   removeImage=true
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/:subcategoryId",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.update"
    ),
    uploadSingleImage,
    validate(
        subcategoryIdParamSchema,
        "params"
    ),
    validate(
        updateSubcategorySchema,
        "body"
    ),
    updateSubcategoryController
);

/*
|--------------------------------------------------------------------------
| Update Subcategory Status
|--------------------------------------------------------------------------
|
| PATCH /api/subcategories/:subcategoryId/status
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/:subcategoryId/status",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.update"
    ),
    validate(
        subcategoryIdParamSchema,
        "params"
    ),
    validate(
        updateSubcategoryStatusSchema,
        "body"
    ),
    updateSubcategoryStatusController
);

/*
|--------------------------------------------------------------------------
| Update Featured State
|--------------------------------------------------------------------------
|
| PATCH /api/subcategories/:subcategoryId/featured
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/:subcategoryId/featured",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.update"
    ),
    validate(
        subcategoryIdParamSchema,
        "params"
    ),
    validate(
        updateSubcategoryFeaturedSchema,
        "body"
    ),
    updateSubcategoryFeaturedController
);

/*
|--------------------------------------------------------------------------
| Update Sort Order
|--------------------------------------------------------------------------
|
| PATCH /api/subcategories/:subcategoryId/sort-order
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/:subcategoryId/sort-order",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.update"
    ),
    validate(
        subcategoryIdParamSchema,
        "params"
    ),
    validate(
        updateSubcategorySortOrderSchema,
        "body"
    ),
    updateSubcategorySortOrderController
);

/*
|--------------------------------------------------------------------------
| Delete Subcategory
|--------------------------------------------------------------------------
|
| DELETE /api/subcategories/:subcategoryId
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:subcategoryId",
    ...adminOnly,
    requireSubcategoryPermission(
        "subcategories.delete"
    ),
    validate(
        subcategoryIdParamSchema,
        "params"
    ),
    deleteSubcategoryController
);

export default router;
