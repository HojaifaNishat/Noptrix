import {
    Types,
} from "mongoose";

import slugify from "slugify";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getPagination,
} from "../../utils/pagination";

import {
    deleteFromCloudinary,
    uploadBufferToCloudinary,
    type CloudinaryUploadResult,
} from "../../services/cloudinary.service";

import {
    Category,
    type CategoryDocument,
    type ICategory,
} from "./category.model";

import {
    CATEGORY_STATUSES,
    type CategoryImage,
    type CategoryListFilters,
    type CategoryListQuery,
    type CategoryListResult,
    type CreateCategoryInput,
    type UpdateCategoryInput,
} from "./category.types";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CATEGORY_IMAGE_FOLDER =
    "noptrix/categories";

const DEFAULT_SORT_FIELD =
    "sortOrder";

const DEFAULT_SORT_DIRECTION =
    "asc";

const MAX_SEARCH_LENGTH =
    120;

/*
|--------------------------------------------------------------------------
| Service Input Types
|--------------------------------------------------------------------------
*/

export interface CreateCategoryServiceInput
    extends CreateCategoryInput {
    readonly image?: {
        readonly buffer: Buffer;
        readonly filename?: string;
        readonly mimeType?: string;
    };
}

export interface UpdateCategoryServiceInput
    extends UpdateCategoryInput {
    readonly image?: {
        readonly buffer: Buffer;
        readonly filename?: string;
        readonly mimeType?: string;
    };

    readonly removeImage?: boolean;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeText = (
    value: string
): string =>
    value.trim();

const normalizeSearch = (
    value?: string
): string | undefined => {
    if (
        value === undefined
    ) {
        return undefined;
    }

    const normalized =
        value.trim();

    if (
        normalized.length === 0
    ) {
        return undefined;
    }

    return normalized.slice(
        0,
        MAX_SEARCH_LENGTH
    );
};

const generateCategorySlug = (
    name: string
): string => {
    const slug =
        slugify(
            name,
            {
                lower: true,
                strict: true,
                trim: true,
            }
        );

    if (!slug) {
        throw ApiError.badRequest(
            "Unable to generate a valid category slug from the provided name.",
            {
                code:
                    "INVALID_CATEGORY_SLUG",
            }
        );
    }

    return slug;
};

const normalizeSlug = (
    slug: string
): string => {
    const normalized =
        slugify(
            slug,
            {
                lower: true,
                strict: true,
                trim: true,
            }
        );

    if (!normalized) {
        throw ApiError.badRequest(
            "A valid category slug is required.",
            {
                code:
                    "INVALID_CATEGORY_SLUG",
            }
        );
    }

    return normalized;
};

const ensureObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (
        !Types.ObjectId.isValid(
            value
        )
    ) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code:
                    "INVALID_OBJECT_ID",
            }
        );
    }

    return new Types.ObjectId(
        value
    );
};

const mapCloudinaryImage = (
    result: CloudinaryUploadResult
): CategoryImage => {
    if (
        result.resourceType !== "image"
    ) {
        throw ApiError.internal(
            "Cloudinary returned an invalid resource type for a category image.",
            {
                code:
                    "INVALID_CATEGORY_IMAGE_RESOURCE_TYPE",
                details: {
                    resourceType:
                        result.resourceType,
                },
            }
        );
    }

    return {
        publicId:
            result.publicId,
        secureUrl:
            result.secureUrl,
        url:
            result.url,
        assetId:
            result.assetId,
        version:
            result.version,
        resourceType:
            result.resourceType,
        format:
            result.format,
        bytes:
            result.bytes,
        width:
            result.width,
        height:
            result.height,
        originalFilename:
            result.originalFilename,
    };
};

/*
|--------------------------------------------------------------------------
| Duplicate Error Detection
|--------------------------------------------------------------------------
*/

const isMongoDuplicateKeyError = (
    error: unknown
): boolean => {
    if (
        typeof error !==
        "object" ||
        error === null
    ) {
        return false;
    }

    return (
        "code" in error &&
        (error as {
            code?: unknown;
        }).code === 11000
    );
};

/*
|--------------------------------------------------------------------------
| Duplicate Error
|--------------------------------------------------------------------------
*/

const categoryDuplicateError =
    (): ApiError =>
        ApiError.conflict(
            "A category with the same name or slug already exists.",
            {
                code:
                    "CATEGORY_ALREADY_EXISTS",
            }
        );

/*
|--------------------------------------------------------------------------
| Find Category
|--------------------------------------------------------------------------
*/

export const getCategoryById =
    async (
        categoryId: string
    ): Promise<CategoryDocument> => {
        const _id =
            ensureObjectId(
                categoryId,
                "category ID"
            );

        const category =
            await Category.findById(
                _id
            ).exec();

        if (!category) {
            throw ApiError.notFound(
                "Category not found.",
                {
                    code:
                        "CATEGORY_NOT_FOUND",
                }
            );
        }

        return category;
    };

/*
|--------------------------------------------------------------------------
| Find By Slug
|--------------------------------------------------------------------------
*/

export const getCategoryBySlug =
    async (
        slug: string
    ): Promise<CategoryDocument> => {
        const normalizedSlug =
            normalizeSlug(slug);

        const category =
            await Category.findOne({
                slug: normalizedSlug,
            }).exec();

        if (!category) {
            throw ApiError.notFound(
                "Category not found.",
                {
                    code:
                        "CATEGORY_NOT_FOUND",
                }
            );
        }

        return category;
    };

/*
|--------------------------------------------------------------------------
| List Categories
|--------------------------------------------------------------------------
*/

export const listCategories =
    async (
        query: CategoryListQuery
    ): Promise<CategoryListResult> => {
        const {
            page,
            limit,
            search,
            status,
            isFeatured,
            sortBy =
                DEFAULT_SORT_FIELD,
            sortOrder =
                DEFAULT_SORT_DIRECTION,
        } = query;

        const pagination =
            getPagination(
                {
                    page,
                    limit,
                },
                {
                    defaultPage: 1,
                    defaultLimit: 20,
                    maxLimit: 100,
                    maxPage: 1_000_000,
                }
            );

        const filters: Record<
            string,
            unknown
        > = {};

        if (status) {
            filters.status =
                status;
        }

        if (
            isFeatured !==
            undefined
        ) {
            filters.isFeatured =
                isFeatured;
        }

        const normalizedSearch =
            normalizeSearch(
                search
            );

        if (
            normalizedSearch
        ) {
            const escapedSearch =
                normalizedSearch.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

            filters.$or = [
                {
                    name: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },
                {
                    slug: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },
            ];
        }

        const sortDirection =
            sortOrder === "desc"
                ? -1
                : 1;

        const sort: Record<
            string,
            1 | -1
        > = {
            [sortBy]:
                sortDirection,
        };

        /*
        |--------------------------------------------------------------
        | Stable secondary sorting
        |--------------------------------------------------------------
        */

        if (
            sortBy !==
            "sortOrder"
        ) {
            sort.sortOrder = 1;
        }

        if (
            sortBy !==
            "name"
        ) {
            sort.name = 1;
        }

        const [
            items,
            total,
        ] = await Promise.all([
            Category.find(filters)
                .sort(sort)
                .skip(pagination.skip)
                .limit(pagination.limit)
                .exec(),

            Category.countDocuments(
                filters
            ).exec(),
        ]);

        return {
            items,
            pagination:
                pagination.meta(total),
        };
    };

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

export const createCategory =
    async (
        input: CreateCategoryServiceInput
    ): Promise<CategoryDocument> => {
        const name: string =
            normalizeText(
                input.name
            );

        if (!name) {
            throw ApiError.badRequest(
                "Category name is required.",
                {
                    code:
                        "CATEGORY_NAME_REQUIRED",
                }
            );
        }

        const slug =
            input.slug
                ? normalizeSlug(
                      input.slug
                  )
                : generateCategorySlug(
                      name
                  );

        const existing =
            await Category.findOne({
                $or: [
                    {
                        name: {
                            $regex:
                                `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                            $options:
                                "i",
                        },
                    },
                    {
                        slug,
                    },
                ],
            }).lean().exec();

        if (existing) {
            throw categoryDuplicateError();
        }

        let uploadedImage:
            CategoryImage |
            undefined;

        if (input.image) {
            const uploadResult =
                await uploadBufferToCloudinary(
                    {
                        buffer:
                            input.image
                                .buffer,

                        filename:
                            input.image
                                .filename,

                        mimeType:
                            input.image
                                .mimeType,
                    },
                    {
                        folder:
                            CATEGORY_IMAGE_FOLDER,

                        resourceType:
                            "image",

                        overwrite:
                            false,

                        useUniqueFilename:
                            true,

                        invalidate:
                            true,
                    }
                );

            uploadedImage =
                mapCloudinaryImage(
                    uploadResult
                );
        }

        try {
            const category: CategoryDocument =
                await Category.create({
                    name,
                    slug,

                    description:
                        input.description
                            ?.trim(),

                    image:
                        uploadedImage,

                    status:
                        input.status ??
                        CATEGORY_STATUSES.ACTIVE,

                    isFeatured:
                        input.isFeatured ??
                        false,

                    sortOrder:
                        input.sortOrder ??
                        0,

                    seo:
                        input.seo,

                    createdBy:
                        input.createdBy
                            ? ensureObjectId(
                                  input.createdBy,
                                  "creator ID"
                              )
                            : undefined,
                });

            return category;
        } catch (error) {
            /*
            |----------------------------------------------------------
            | Database failed after Cloudinary upload.
            |----------------------------------------------------------
            */

            if (
                uploadedImage
                    ?.publicId
            ) {
                try {
                    await deleteFromCloudinary(
                        uploadedImage.publicId,
                        uploadedImage.resourceType
                    );
                } catch {
                    /*
                    |--------------------------------------------------
                    | Cleanup failure must not hide the DB error.
                    |--------------------------------------------------
                    */
                }
            }

            if (
                isMongoDuplicateKeyError(
                    error
                )
            ) {
                throw categoryDuplicateError();
            }

            throw error;
        }
    };

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

export const updateCategory =
    async (
        categoryId: string,
        input: UpdateCategoryServiceInput
    ): Promise<CategoryDocument> => {
        const _id =
            ensureObjectId(
                categoryId,
                "category ID"
            );

        const category =
            await Category.findById(
                _id
            ).exec();

        if (!category) {
            throw ApiError.notFound(
                "Category not found.",
                {
                    code:
                        "CATEGORY_NOT_FOUND",
                }
            );
        }

        if (
            input.name !==
            undefined
        ) {
            const name =
                normalizeText(
                    input.name
                );

            if (!name) {
                throw ApiError.badRequest(
                    "Category name cannot be empty.",
                    {
                        code:
                            "INVALID_CATEGORY_NAME",
                    }
                );
            }

            const duplicate =
                await Category.findOne({
                    _id: {
                        $ne: _id,
                    },
                    name: {
                        $regex:
                            `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                        $options:
                            "i",
                    },
                }).lean().exec();

            if (duplicate) {
                throw categoryDuplicateError();
            }

            category.name =
                name;
        }

        if (
            input.slug !==
            undefined
        ) {
            const slug =
                normalizeSlug(
                    input.slug
                );

            const duplicate =
                await Category.findOne({
                    _id: {
                        $ne: _id,
                    },
                    slug,
                }).lean().exec();

            if (duplicate) {
                throw categoryDuplicateError();
            }

            category.slug =
                slug;
        }

        if (
            input.description !==
            undefined
        ) {
            category.description =
                input.description.trim();
        }

        if (
            input.status !==
            undefined
        ) {
            category.status =
                input.status;
        }

        if (
            input.isFeatured !==
            undefined
        ) {
            category.isFeatured =
                input.isFeatured;
        }

        if (
            input.sortOrder !==
            undefined
        ) {
            category.sortOrder =
                input.sortOrder;
        }

        if (
            input.seo !==
            undefined
        ) {
            category.seo =
                input.seo;
        }

        if (
            input.updatedBy
        ) {
            category.updatedBy =
                ensureObjectId(
                    input.updatedBy,
                    "updater ID"
                );
        }

        const oldImage =
            category.image;

        /*
        |--------------------------------------------------------------
        | Remove existing image
        |--------------------------------------------------------------
        */

        if (
            input.removeImage ===
                true &&
            !input.image &&
            oldImage
        ) {
            category.image =
                undefined;

            await category.save();

            try {
                await deleteFromCloudinary(
                    oldImage.publicId,
                    oldImage.resourceType
                );
            } catch {
                /*
                |------------------------------------------------------
                | Database state is already correct.
                | Cloudinary cleanup can be retried separately.
                |------------------------------------------------------
                */
            }

            return category;
        }

        /*
        |--------------------------------------------------------------
        | Replace image
        |--------------------------------------------------------------
        */

        if (input.image) {
            const uploadResult =
                await uploadBufferToCloudinary(
                    {
                        buffer:
                            input.image
                                .buffer,

                        filename:
                            input.image
                                .filename,

                        mimeType:
                            input.image
                                .mimeType,
                    },
                    {
                        folder:
                            CATEGORY_IMAGE_FOLDER,

                        resourceType:
                            "image",

                        overwrite:
                            false,

                        useUniqueFilename:
                            true,

                        invalidate:
                            true,
                    }
                );

            const newImage =
                mapCloudinaryImage(
                    uploadResult
                );

            category.image =
                newImage;

            try {
                await category.save();
            } catch (error) {
                /*
                |------------------------------------------------------
                | DB update failed.
                | Delete newly uploaded asset.
                |------------------------------------------------------
                */

                try {
                    await deleteFromCloudinary(
                        newImage.publicId,
                        newImage.resourceType
                    );
                } catch {
                    /*
                    | Keep original DB error.
                    |--------------------------------------------------
                    */
                }

                if (
                    isMongoDuplicateKeyError(
                        error
                    )
                ) {
                    throw categoryDuplicateError();
                }

                throw error;
            }

            /*
            |----------------------------------------------------------
            | Delete old image only after DB points to new image.
            |----------------------------------------------------------
            */

            if (
                oldImage &&
                oldImage.publicId !==
                    newImage.publicId
            ) {
                try {
                    await deleteFromCloudinary(
                        oldImage.publicId,
                        oldImage.resourceType
                    );
                } catch {
                    /*
                    | New image is already canonical in DB.
                    | Cleanup can be retried.
                    */
                }
            }

            return category;
        }

        /*
        |--------------------------------------------------------------
        | Normal update
        |--------------------------------------------------------------
        */

        try {
            await category.save();
        } catch (error) {
            if (
                isMongoDuplicateKeyError(
                    error
                )
            ) {
                throw categoryDuplicateError();
            }

            throw error;
        }

        return category;
    };

/*
|--------------------------------------------------------------------------
| Delete Category
|--------------------------------------------------------------------------
*/

export const deleteCategory =
    async (
        categoryId: string
    ): Promise<void> => {
        const _id =
            ensureObjectId(
                categoryId,
                "category ID"
            );

        const category =
            await Category.findById(
                _id
            ).exec();

        if (!category) {
            throw ApiError.notFound(
                "Category not found.",
                {
                    code:
                        "CATEGORY_NOT_FOUND",
                }
            );
        }

        /*
        |--------------------------------------------------------------
        | Delete DB record first.
        |--------------------------------------------------------------
        */

        await Category.deleteOne({
            _id,
        }).exec();

        /*
        |--------------------------------------------------------------
        | Cloudinary cleanup.
        |--------------------------------------------------------------
        */

        if (
            category.image
                ?.publicId
        ) {
            try {
                await deleteFromCloudinary(
                    category.image.publicId,
                    category.image.resourceType
                );
            } catch {
                /*
                |------------------------------------------------------
                | DB deletion succeeded.
                | Cloudinary cleanup failure must not resurrect data.
                |------------------------------------------------------
                */
            }
        }
    };

/*
|--------------------------------------------------------------------------
| Category Status
|--------------------------------------------------------------------------
*/

export const updateCategoryStatus =
    async (
        categoryId: string,
        status:
            ICategory["status"],
        updatedBy?: string
    ): Promise<CategoryDocument> => {
        return updateCategory(
            categoryId,
            {
                status,
                updatedBy,
            }
        );
    };

/*
|--------------------------------------------------------------------------
| Featured State
|--------------------------------------------------------------------------
*/

export const updateCategoryFeatured =
    async (
        categoryId: string,
        isFeatured: boolean,
        updatedBy?: string
    ): Promise<CategoryDocument> => {
        return updateCategory(
            categoryId,
            {
                isFeatured,
                updatedBy,
            }
        );
    };

/*
|--------------------------------------------------------------------------
| Sort Order
|--------------------------------------------------------------------------
*/

export const updateCategorySortOrder =
    async (
        categoryId: string,
        sortOrder: number,
        updatedBy?: string
    ): Promise<CategoryDocument> => {
        return updateCategory(
            categoryId,
            {
                sortOrder,
                updatedBy,
            }
        );
    };

/*
|--------------------------------------------------------------------------
| Active Categories
|--------------------------------------------------------------------------
*/

export const listActiveCategories =
    async (): Promise<
        readonly CategoryDocument[]
    > => {
        return Category.find({
            status:
                CATEGORY_STATUSES.ACTIVE,
        })
            .sort({
                sortOrder: 1,
                name: 1,
            })
            .exec();
    };
