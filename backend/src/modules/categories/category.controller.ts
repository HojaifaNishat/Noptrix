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

import {
    createCategory,
    deleteCategory,
    getCategoryById,
    getCategoryBySlug,
    listActiveCategories,
    listCategories,
    updateCategory,
    updateCategoryFeatured,
    updateCategorySortOrder,
    updateCategoryStatus,
} from "./category.service";

import type {
    CategoryListQuery,
    CreateCategoryInput,
    UpdateCategoryInput,
} from "./category.types";

/*
|--------------------------------------------------------------------------
| Request Types
|--------------------------------------------------------------------------
*/

type CategoryIdRequest =
    Request<
        { categoryId: string }
    >;

type CategorySlugRequest =
    Request<
        { slug: string }
    >;

type CreateCategoryRequest =
    Request<
        Record<string, never>,
        unknown,
        CreateCategoryInput
    >;

type UpdateCategoryRequest =
    Request<
        { categoryId: string },
        unknown,
        UpdateCategoryInput
    >;

type ListCategoryRequest =
    Request<
        Record<string, never>,
        unknown,
        unknown
    >;

type StatusRequest =
    Request<
        { categoryId: string },
        unknown,
        {
            status: CreateCategoryInput["status"];
        }
    >;

type FeaturedRequest =
    Request<
        { categoryId: string },
        unknown,
        {
            isFeatured: boolean;
        }
    >;

type SortOrderRequest =
    Request<
        { categoryId: string },
        unknown,
        {
            sortOrder: number;
        }
    >;

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

export const createCategoryController =
    asyncHandler(
        async (
            req: CreateCategoryRequest,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const file =
                req.file;

            const category =
                await createCategory({
                    ...req.body,

                    createdBy:
                        adminId,

                    image:
                        file
                            ? {
                                  buffer:
                                      file.buffer,

                                  filename:
                                      file.originalname,

                                  mimeType:
                                      file.mimetype,
                              }
                            : undefined,
                });

            res
                .status(201)
                .json(
                    ApiResponse.created(
                        category,
                        "Category created successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Get Category By ID
|--------------------------------------------------------------------------
*/

export const getCategoryController =
    asyncHandler(
        async (
            req: CategoryIdRequest,
            res: Response
        ): Promise<void> => {
            const category =
                await getCategoryById(
                    req.params.categoryId
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        category,
                        "Category retrieved successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Get Category By Slug
|--------------------------------------------------------------------------
*/

export const getCategoryBySlugController =
    asyncHandler(
        async (
            req: CategorySlugRequest,
            res: Response
        ): Promise<void> => {
            const category =
                await getCategoryBySlug(
                    req.params.slug
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        category,
                        "Category retrieved successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| List Categories
|--------------------------------------------------------------------------
*/

export const listCategoriesController =
    asyncHandler(
        async (
            req: ListCategoryRequest,
            res: Response
        ): Promise<void> => {
            const result =
                await listCategories(
                    req.query as unknown as CategoryListQuery
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        result.items,
                        "Categories retrieved successfully.",
                        result.pagination
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| List Active Categories
|--------------------------------------------------------------------------
*/

export const listActiveCategoriesController =
    asyncHandler(
        async (
            _req: Request,
            res: Response
        ): Promise<void> => {
            const categories =
                await listActiveCategories();

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        categories,
                        "Active categories retrieved successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

export const updateCategoryController =
    asyncHandler(
        async (
            req: UpdateCategoryRequest,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const file =
                req.file;

            const category =
                await updateCategory(
                    req.params.categoryId,
                    {
                        ...req.body,

                        updatedBy:
                            adminId,

                        image:
                            file
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

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        category,
                        "Category updated successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Category Status
|--------------------------------------------------------------------------
*/

export const updateCategoryStatusController =
    asyncHandler(
        async (
            req: StatusRequest,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const category =
                await updateCategoryStatus(
                    req.params.categoryId,
                    req.body.status!,
                    adminId
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        category,
                        "Category status updated successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Featured State
|--------------------------------------------------------------------------
*/

export const updateCategoryFeaturedController =
    asyncHandler(
        async (
            req: FeaturedRequest,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const category =
                await updateCategoryFeatured(
                    req.params.categoryId,
                    req.body.isFeatured,
                    adminId
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        category,
                        "Category featured state updated successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Update Sort Order
|--------------------------------------------------------------------------
*/

export const updateCategorySortOrderController =
    asyncHandler(
        async (
            req: SortOrderRequest,
            res: Response
        ): Promise<void> => {
            const adminId =
                getAuthenticatedAdminId(
                    req
                );

            const category =
                await updateCategorySortOrder(
                    req.params.categoryId,
                    req.body.sortOrder,
                    adminId
                );

            res
                .status(200)
                .json(
                    ApiResponse.ok(
                        category,
                        "Category sort order updated successfully."
                    ).serialize()
                );
        }
    );

/*
|--------------------------------------------------------------------------
| Delete Category
|--------------------------------------------------------------------------
*/

export const deleteCategoryController =
    asyncHandler(
        async (
            req: CategoryIdRequest,
            res: Response
        ): Promise<void> => {
            await getAuthenticatedAdminId(
                req
            );

            await deleteCategory(
                req.params.categoryId
            );

            res
                .status(204)
                .send();
        }
    );
