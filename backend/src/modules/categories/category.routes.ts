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
    normalizeCategoryMultipartBody,
    MultipartParseError,
} from "../../utils/parseMultipart";

import {
    createCategoryController,
    getCategoryController,
    getCategoryBySlugController,
    listCategoriesController,
    listActiveCategoriesController,
    updateCategoryController,
    updateCategoryStatusController,
    updateCategoryFeaturedController,
    updateCategorySortOrderController,
    deleteCategoryController,
} from "./category.controller";

import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdParamSchema,
    categorySlugParamSchema,
    categoryListQuerySchema,
    updateCategoryStatusSchema,
    updateCategoryFeaturedSchema,
    updateCategorySortOrderSchema,
} from "./category.validator";

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

const router =
    Router();

/*
|--------------------------------------------------------------------------
| Category Multipart Body Normalization
|--------------------------------------------------------------------------
|
| Multer provides multipart/form-data fields as strings.
| Normalize typed fields before Zod validation.
|
|--------------------------------------------------------------------------
*/

const normalizeCategoryMultipart =
    (
        req: Parameters<RequestHandler>[0],
        res: Parameters<RequestHandler>[1],
        next: Parameters<RequestHandler>[2],
    ): void => {
        try {
            req.body =
                normalizeCategoryMultipartBody(
                    req.body as Record<string, unknown>
                );

            next();
        } catch (error) {
            if (
                error instanceof MultipartParseError
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        error.message,
                    code:
                        error.code,
                });

                return;
            }

            next(error);
        }
    };

/*
|--------------------------------------------------------------------------
| Category Permissions
|--------------------------------------------------------------------------
|
| OWNER
|   → Full category access automatically.
|
| ADMIN
|   → Access is controlled by RolePermission.
|
| Supported permissions:
|
| categories.read
| categories.create
| categories.update
| categories.delete
|
| Wildcards are supported by hasPermissionMatch():
|
| categories.*
| *
|
|--------------------------------------------------------------------------
*/

const requireCategoryPermission =
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
            | Admin authentication must already have run.
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
            | OWNER
            |--------------------------------------------------------------------------
            |
            | OWNER has system-wide access and does not depend on
            | RolePermission database records.
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
            | The generic permission middleware reads req.permissions.
            | Admin authentication keeps the resolved permissions in
            | req.adminAuth.permissions.
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
                        "CATEGORY_PERMISSION_DENIED",
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
| Category management is an administrative operation.
|
| adminAuth
|   → validates administrative access token
|
| adminSecretVerified
|   → requires completed admin secret verification
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
| These endpoints are intentionally outside admin authentication.
|
| GET /api/categories
| GET /api/categories/active
| GET /api/categories/slug/:slug
|
| Public storefront/category navigation can use these endpoints.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| List Categories
|--------------------------------------------------------------------------
|
| GET /api/categories
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    validate(
        categoryListQuerySchema,
        "query"
    ),
    listCategoriesController
);

/*
|--------------------------------------------------------------------------
| List Active Categories
|--------------------------------------------------------------------------
|
| GET /api/categories/active
|--------------------------------------------------------------------------
*/

router.get(
    "/active",
    listActiveCategoriesController
);

/*
|--------------------------------------------------------------------------
| Get Category By Slug
|--------------------------------------------------------------------------
|
| GET /api/categories/slug/:slug
|--------------------------------------------------------------------------
*/

router.get(
    "/slug/:slug",
    validate(
        categorySlugParamSchema,
        "params"
    ),
    getCategoryBySlugController
);

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
|
| POST /api/categories
|
| multipart/form-data
| image field → image
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    ...adminOnly,
    requireCategoryPermission(
        "categories.create"
    ),
    uploadSingleImage,
    normalizeCategoryMultipart,
    validate(
        createCategorySchema,
        "body"
    ),
    createCategoryController
);

/*
|--------------------------------------------------------------------------
| Get Category By ID
|--------------------------------------------------------------------------
|
| GET /api/categories/:categoryId
|
| Admin read endpoint.
|--------------------------------------------------------------------------
*/

router.get(
    "/:categoryId",
    ...adminOnly,
    requireCategoryPermission(
        "categories.read"
    ),
    validate(
        categoryIdParamSchema,
        "params"
    ),
    getCategoryController
);

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
|
| PATCH /api/categories/:categoryId
|
| multipart/form-data
| image field → image
|
| To remove existing image:
| removeImage=true
|--------------------------------------------------------------------------
*/

router.patch(
    "/:categoryId",
    ...adminOnly,
    requireCategoryPermission(
        "categories.update"
    ),
    uploadSingleImage,
    normalizeCategoryMultipart,
    validate(
        categoryIdParamSchema,
        "params"
    ),
    validate(
        updateCategorySchema,
        "body"
    ),
    updateCategoryController
);

/*
|--------------------------------------------------------------------------
| Update Category Status
|--------------------------------------------------------------------------
|
| PATCH /api/categories/:categoryId/status
|--------------------------------------------------------------------------
*/

router.patch(
    "/:categoryId/status",
    ...adminOnly,
    requireCategoryPermission(
        "categories.update"
    ),
    validate(
        categoryIdParamSchema,
        "params"
    ),
    validate(
        updateCategoryStatusSchema,
        "body"
    ),
    updateCategoryStatusController
);

/*
|--------------------------------------------------------------------------
| Update Featured State
|--------------------------------------------------------------------------
|
| PATCH /api/categories/:categoryId/featured
|--------------------------------------------------------------------------
*/

router.patch(
    "/:categoryId/featured",
    ...adminOnly,
    requireCategoryPermission(
        "categories.update"
    ),
    validate(
        categoryIdParamSchema,
        "params"
    ),
    validate(
        updateCategoryFeaturedSchema,
        "body"
    ),
    updateCategoryFeaturedController
);

/*
|--------------------------------------------------------------------------
| Update Sort Order
|--------------------------------------------------------------------------
|
| PATCH /api/categories/:categoryId/sort-order
|--------------------------------------------------------------------------
*/

router.patch(
    "/:categoryId/sort-order",
    ...adminOnly,
    requireCategoryPermission(
        "categories.update"
    ),
    validate(
        categoryIdParamSchema,
        "params"
    ),
    validate(
        updateCategorySortOrderSchema,
        "body"
    ),
    updateCategorySortOrderController
);

/*
|--------------------------------------------------------------------------
| Delete Category
|--------------------------------------------------------------------------
|
| DELETE /api/categories/:categoryId
|--------------------------------------------------------------------------
*/

router.delete(
    "/:categoryId",
    ...adminOnly,
    requireCategoryPermission(
        "categories.delete"
    ),
    validate(
        categoryIdParamSchema,
        "params"
    ),
    deleteCategoryController
);

export default router;
