import type {
    Request,
    Response,
} from "express";

import {
    ApiResponse,
} from "../../utils/ApiResponse";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    getAuthenticatedAdminId,
} from "../../middlewares/adminAuth.middleware";

import type {
    CreateSubcategoryInput,
    SubcategoryListQuery,
    UpdateSubcategoryInput,
} from "./subcategory.types";

import {
    createSubcategory,
    deleteSubcategory,
    getSubcategoryById,
    getSubcategoryBySlug,
    listActiveSubcategories,
    listSubcategories,
    updateSubcategory,
    updateSubcategoryFeatured,
    updateSubcategorySortOrder,
    updateSubcategoryStatus,
} from "./subcategory.service";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getParamString = (
    value:
        | string
        | string[]
        | undefined
): string => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return "";
};

/*
|--------------------------------------------------------------------------
| List Subcategories
|--------------------------------------------------------------------------
*/

export const listSubcategoriesController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const query =
                req.query as unknown as SubcategoryListQuery;

            const result =
                await listSubcategories(
                    query
                );

            res.status(200).json(
                ApiResponse.ok(
                    result,
                    "Subcategories fetched successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Active Subcategories
|--------------------------------------------------------------------------
*/

export const listActiveSubcategoriesController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const categoryId =
                typeof req.query.categoryId ===
                "string"
                    ? req.query.categoryId
                    : undefined;

            const items =
                await listActiveSubcategories(
                    categoryId
                );

            res.status(200).json(
                ApiResponse.ok(
                    items,
                    "Active subcategories fetched successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/

export const getSubcategoryController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const subcategoryId =
                getParamString(
                    req.params
                        .subcategoryId
                );

            const subcategory =
                await getSubcategoryById(
                    subcategoryId
                );

            res.status(200).json(
                ApiResponse.ok(
                    subcategory,
                    "Subcategory fetched successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Get By Slug
|--------------------------------------------------------------------------
*/

export const getSubcategoryBySlugController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const slug =
                getParamString(
                    req.params.slug
                );

            const subcategory =
                await getSubcategoryBySlug(
                    slug
                );

            res.status(200).json(
                ApiResponse.ok(
                    subcategory,
                    "Subcategory fetched successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export const createSubcategoryController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const file =
                req.file;

            const body =
                req.body as CreateSubcategoryInput;

            const subcategory =
                await createSubcategory(
                    {
                        ...body,

                        createdBy:
                            adminId,

                        image: file
                            ? {
                                  buffer:
                                      file.buffer,
                                  filename:
                                      file.originalname,
                                  mimeType:
                                      file.mimetype,
                              }
                            : undefined,
                    }
                );

            res.status(201).json(
                ApiResponse.created(
                    subcategory,
                    "Subcategory created successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export const updateSubcategoryController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const subcategoryId =
                getParamString(
                    req.params
                        .subcategoryId
                );

            const file =
                req.file;

            const body =
                req.body as UpdateSubcategoryInput;

            const subcategory =
                await updateSubcategory(
                    subcategoryId,
                    {
                        ...body,

                        updatedBy:
                            adminId,

                        image: file
                            ? {
                                  buffer:
                                      file.buffer,
                                  filename:
                                      file.originalname,
                                  mimeType:
                                      file.mimetype,
                              }
                            : undefined,
                    }
                );

            res.status(200).json(
                ApiResponse.ok(
                    subcategory,
                    "Subcategory updated successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Status
|--------------------------------------------------------------------------
*/

export const updateSubcategoryStatusController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const subcategoryId =
                getParamString(
                    req.params
                        .subcategoryId
                );

            const subcategory =
                await updateSubcategoryStatus(
                    subcategoryId,
                    req.body.status,
                    adminId
                );

            res.status(200).json(
                ApiResponse.ok(
                    subcategory,
                    "Subcategory status updated successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Featured
|--------------------------------------------------------------------------
*/

export const updateSubcategoryFeaturedController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const subcategoryId =
                getParamString(
                    req.params
                        .subcategoryId
                );

            const subcategory =
                await updateSubcategoryFeatured(
                    subcategoryId,
                    req.body.isFeatured,
                    adminId
                );

            res.status(200).json(
                ApiResponse.ok(
                    subcategory,
                    "Subcategory featured status updated successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Sort Order
|--------------------------------------------------------------------------
*/

export const updateSubcategorySortOrderController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const subcategoryId =
                getParamString(
                    req.params
                        .subcategoryId
                );

            const subcategory =
                await updateSubcategorySortOrder(
                    subcategoryId,
                    req.body.sortOrder,
                    adminId
                );

            res.status(200).json(
                ApiResponse.ok(
                    subcategory,
                    "Subcategory sort order updated successfully."
                ).serialize()
            );
        }
    );

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export const deleteSubcategoryController =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ): Promise<void> => {
            const subcategoryId =
                getParamString(
                    req.params
                        .subcategoryId
                );

            await deleteSubcategory(
                subcategoryId
            );

            res.status(204).send();
        }
    );
