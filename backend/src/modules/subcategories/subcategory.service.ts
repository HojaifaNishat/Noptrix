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
} from "../categories/category.model";

import {
    Subcategory,
    type ISubcategory,
} from "./subcategory.model";

import {
    type CreateSubcategoryInput,
    type SubcategoryDocument,
    type SubcategoryImage,
    type SubcategoryListQuery,
    type SubcategoryListResult,
    type UpdateSubcategoryInput,
} from "./subcategory.types";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const SUBCATEGORY_IMAGE_FOLDER =
    "noptrix/subcategories";

const DEFAULT_SORT_BY =
    "sortOrder" as const;

const DEFAULT_SORT_ORDER =
    "asc" as const;

const MAX_SEARCH_LENGTH = 120;

/*
|--------------------------------------------------------------------------
| Service Input Types
|--------------------------------------------------------------------------
*/

export interface CreateSubcategoryServiceInput
    extends CreateSubcategoryInput {
    readonly image?: {
        readonly buffer: Buffer;
        readonly filename?: string;
        readonly mimeType?: string;
    };
}

export interface UpdateSubcategoryServiceInput
    extends UpdateSubcategoryInput {
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
): string => value.trim();

const normalizeSearch = (
    value?: string
): string | undefined => {
    if (
        value === undefined ||
        value === null
    ) {
        return undefined;
    }

    const normalized =
        value.trim();

    if (!normalized) {
        return undefined;
    }

    if (
        normalized.length >
        MAX_SEARCH_LENGTH
    ) {
        throw ApiError.badRequest(
            "Search query is too long.",
            {
                code:
                    "SUBCATEGORY_SEARCH_TOO_LONG",
            }
        );
    }

    return normalized;
};

const generateSubcategorySlug = (
    name: string
): string => {
    const slug =
        slugify(name, {
            lower: true,
            strict: true,
            trim: true,
        });

    if (!slug) {
        throw ApiError.badRequest(
            "Unable to generate a valid subcategory slug.",
            {
                code:
                    "INVALID_SUBCATEGORY_SLUG",
            }
        );
    }

    return slug;
};

const normalizeSlug = (
    slug: string
): string => {
    const normalized =
        slugify(slug, {
            lower: true,
            strict: true,
            trim: true,
        });

    if (!normalized) {
        throw ApiError.badRequest(
            "Invalid subcategory slug.",
            {
                code:
                    "INVALID_SUBCATEGORY_SLUG",
            }
        );
    }

    return normalized;
};

const ensureObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code:
                    "INVALID_OBJECT_ID",
                details: {
                    field:
                        fieldName,
                },
            }
        );
    }

    return new Types.ObjectId(
        value
    );
};

const mapCloudinaryImage = (
    result: CloudinaryUploadResult
): SubcategoryImage => {
    if (
        result.resourceType !==
        "image"
    ) {
        throw ApiError.internal(
            "Cloudinary returned an invalid resource type for a subcategory image.",
            {
                code:
                    "INVALID_SUBCATEGORY_IMAGE_RESOURCE_TYPE",
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

const isMongoDuplicateKeyError = (
    error: unknown
): boolean => {
    return (
        typeof error ===
            "object" &&
        error !== null &&
        "code" in error &&
        (
            error as {
                code?: unknown;
            }
        ).code === 11000
    );
};

const subcategoryDuplicateError =
    (): ApiError =>
        ApiError.conflict(
            "A subcategory with the same slug already exists in this category.",
            {
                code:
                    "SUBCATEGORY_ALREADY_EXISTS",
            }
        );

/*
|--------------------------------------------------------------------------
| Category Validation
|--------------------------------------------------------------------------
*/

const ensureCategoryExists =
    async (
        categoryId: Types.ObjectId
    ): Promise<void> => {
        const category =
            await Category.findById(
                categoryId
            )
                .select(
                    "_id status"
                )
                .lean()
                .exec();

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
            category.status ===
            "ARCHIVED"
        ) {
            throw ApiError.badRequest(
                "Subcategories cannot be assigned to an archived category.",
                {
                    code:
                        "CATEGORY_ARCHIVED",
                }
            );
        }
    };

/*
|--------------------------------------------------------------------------
| List Subcategories
|--------------------------------------------------------------------------
*/

export const listSubcategories =
    async (
        query: SubcategoryListQuery
    ): Promise<SubcategoryListResult> => {
        const page =
            Math.max(
                1,
                query.page || 1
            );

        const limit =
            Math.min(
                100,
                Math.max(
                    1,
                    query.limit || 20
                )
            );

        const search =
            normalizeSearch(
                query.search
            );

        const filter: Record<
            string,
            unknown
        > = {};

        if (query.categoryId) {
            filter.categoryId =
                ensureObjectId(
                    query.categoryId,
                    "category ID"
                );
        }

        if (query.status) {
            filter.status =
                query.status;
        }

        if (
            query.isFeatured !==
            undefined
        ) {
            filter.isFeatured =
                query.isFeatured;
        }

        if (search) {
            const escapedSearch =
                search.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

            filter.$or = [
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

        const sortBy =
            query.sortBy ??
            DEFAULT_SORT_BY;

        const sortOrder =
            query.sortOrder ??
            DEFAULT_SORT_ORDER;

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

        if (
            sortBy !==
            "sortOrder"
        ) {
            sort.sortOrder = 1;
        }

        sort._id = 1;

        const {
            skip,
            limit:
                paginationLimit,
        } = getPagination({
            page,
            limit,
        });

        const [
            items,
            total,
        ] = await Promise.all([
            Subcategory.find(
                filter
            )
                .sort(sort)
                .skip(skip)
                .limit(
                    paginationLimit
                )
                .lean()
                .exec(),

            Subcategory.countDocuments(
                filter
            ),
        ]);

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                      total /
                          paginationLimit
                  );

        return {
            items:
                items as unknown as readonly SubcategoryDocument[],

            pagination: {
                page,
                limit:
                    paginationLimit,
                total,
                totalPages,
                hasNextPage:
                    page <
                    totalPages,
                hasPreviousPage:
                    page > 1 &&
                    totalPages > 0,
            },
        };
    };

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/

export const getSubcategoryById =
    async (
        subcategoryId: string
    ): Promise<SubcategoryDocument> => {
        const id =
            ensureObjectId(
                subcategoryId,
                "subcategory ID"
            );

        const subcategory =
            await Subcategory.findById(
                id
            ).exec();

        if (!subcategory) {
            throw ApiError.notFound(
                "Subcategory not found.",
                {
                    code:
                        "SUBCATEGORY_NOT_FOUND",
                }
            );
        }

        return subcategory;
    };

/*
|--------------------------------------------------------------------------
| Get By Slug
|--------------------------------------------------------------------------
*/

export const getSubcategoryBySlug =
    async (
        slug: string
    ): Promise<SubcategoryDocument> => {
        const normalizedSlug =
            normalizeSlug(slug);

        const subcategory =
            await Subcategory.findOne({
                slug:
                    normalizedSlug,
            }).exec();

        if (!subcategory) {
            throw ApiError.notFound(
                "Subcategory not found.",
                {
                    code:
                        "SUBCATEGORY_NOT_FOUND",
                }
            );
        }

        return subcategory;
    };

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

export const createSubcategory =
    async (
        input: CreateSubcategoryServiceInput
    ): Promise<SubcategoryDocument> => {
        const categoryId =
            ensureObjectId(
                input.categoryId,
                "category ID"
            );

        await ensureCategoryExists(
            categoryId
        );

        const name =
            normalizeText(
                input.name
            );

        const slug =
            input.slug
                ? normalizeSlug(
                      input.slug
                  )
                : generateSubcategorySlug(
                      name
                  );

        const existing =
            await Subcategory.findOne({
                categoryId,
                slug,
            })
                .select("_id")
                .lean()
                .exec();

        if (existing) {
            throw subcategoryDuplicateError();
        }

        let image:
            | SubcategoryImage
            | undefined;

        if (input.image) {
            const upload =
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
                            SUBCATEGORY_IMAGE_FOLDER,
                        resourceType:
                            "image",
                        overwrite:
                            false,
                        useUniqueFilename:
                            true,
                    }
                );

            image =
                mapCloudinaryImage(
                    upload
                );
        }

        try {
            const subcategory =
                await Subcategory.create(
                    {
                        categoryId,
                        name,
                        slug,

                        description:
                            input.description
                                ? normalizeText(
                                      input.description
                                  )
                                : undefined,

                        image,

                        status:
                            input.status ??
                            "ACTIVE",

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
                    }
                );

            return subcategory;
        } catch (error) {
            if (image?.publicId) {
                try {
                    await deleteFromCloudinary(
                        image.publicId
                    );
                } catch {
                    // Preserve original database error.
                }
            }

            if (
                isMongoDuplicateKeyError(
                    error
                )
            ) {
                throw subcategoryDuplicateError();
            }

            throw error;
        }
    };

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

export const updateSubcategory =
    async (
        subcategoryId: string,
        input: UpdateSubcategoryServiceInput
    ): Promise<SubcategoryDocument> => {
        const id =
            ensureObjectId(
                subcategoryId,
                "subcategory ID"
            );

        const subcategory =
            await Subcategory.findById(
                id
            ).exec();

        if (!subcategory) {
            throw ApiError.notFound(
                "Subcategory not found.",
                {
                    code:
                        "SUBCATEGORY_NOT_FOUND",
                }
            );
        }

        const oldImage =
            subcategory.image;

        let newImage:
            | SubcategoryImage
            | undefined;

        let uploadedNewImage =
            false;

        if (
            input.categoryId !==
            undefined
        ) {
            const categoryId =
                ensureObjectId(
                    input.categoryId,
                    "category ID"
                );

            await ensureCategoryExists(
                categoryId
            );

            subcategory.categoryId =
                categoryId;
        }

        if (input.name !== undefined) {
            subcategory.name =
                normalizeText(
                    input.name
                );
        }

        if (input.slug !== undefined) {
            subcategory.slug =
                normalizeSlug(
                    input.slug
                );
        } else if (
            input.name !==
                undefined
        ) {
            subcategory.slug =
                generateSubcategorySlug(
                    subcategory.name
                );
        }

        if (
            input.description !==
            undefined
        ) {
            subcategory.description =
                normalizeText(
                    input.description
                );
        }

        if (
            input.status !==
            undefined
        ) {
            subcategory.status =
                input.status;
        }

        if (
            input.isFeatured !==
            undefined
        ) {
            subcategory.isFeatured =
                input.isFeatured;
        }

        if (
            input.sortOrder !==
            undefined
        ) {
            subcategory.sortOrder =
                input.sortOrder;
        }

        if (input.seo !== undefined) {
            subcategory.seo =
                input.seo;
        }

        if (
            input.updatedBy !==
            undefined
        ) {
            subcategory.updatedBy =
                ensureObjectId(
                    input.updatedBy,
                    "updater ID"
                );
        }

        if (input.removeImage) {
            subcategory.image =
                undefined;
        }

        if (input.image) {
            const upload =
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
                            SUBCATEGORY_IMAGE_FOLDER,
                        resourceType:
                            "image",
                        overwrite:
                            false,
                        useUniqueFilename:
                            true,
                    }
                );

            newImage =
                mapCloudinaryImage(
                    upload
                );

            uploadedNewImage =
                true;

            subcategory.image =
                newImage;
        }

        const duplicate =
            await Subcategory.findOne({
                _id: {
                    $ne: id,
                },

                categoryId:
                    subcategory.categoryId,

                slug:
                    subcategory.slug,
            })
                .select("_id")
                .lean()
                .exec();

        if (duplicate) {
            if (
                uploadedNewImage &&
                newImage?.publicId
            ) {
                try {
                    await deleteFromCloudinary(
                        newImage.publicId
                    );
                } catch {
                    // Preserve duplicate error.
                }
            }

            throw subcategoryDuplicateError();
        }

        try {
            await subcategory.save();
        } catch (error) {
            if (
                uploadedNewImage &&
                newImage?.publicId
            ) {
                try {
                    await deleteFromCloudinary(
                        newImage.publicId
                    );
                } catch {
                    // Preserve original database error.
                }
            }

            if (
                isMongoDuplicateKeyError(
                    error
                )
            ) {
                throw subcategoryDuplicateError();
            }

            throw error;
        }

        if (
            uploadedNewImage &&
            newImage?.publicId &&
            oldImage?.publicId &&
            oldImage.publicId !==
                newImage.publicId
        ) {
            try {
                await deleteFromCloudinary(
                    oldImage.publicId
                );
            } catch {
                // New database state remains valid.
            }
        } else if (
            input.removeImage &&
            oldImage?.publicId &&
            !newImage
        ) {
            try {
                await deleteFromCloudinary(
                    oldImage.publicId
                );
            } catch {
                // Database state remains valid.
            }
        }

        return subcategory;
    };

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

export const updateSubcategoryStatus =
    async (
        subcategoryId: string,
        status: ISubcategory["status"],
        updatedBy?: string
    ): Promise<SubcategoryDocument> => {
        return updateSubcategory(
            subcategoryId,
            {
                status,
                updatedBy,
            }
        );
    };

/*
|--------------------------------------------------------------------------
| Featured
|--------------------------------------------------------------------------
*/

export const updateSubcategoryFeatured =
    async (
        subcategoryId: string,
        isFeatured: boolean,
        updatedBy?: string
    ): Promise<SubcategoryDocument> => {
        return updateSubcategory(
            subcategoryId,
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

export const updateSubcategorySortOrder =
    async (
        subcategoryId: string,
        sortOrder: number,
        updatedBy?: string
    ): Promise<SubcategoryDocument> => {
        return updateSubcategory(
            subcategoryId,
            {
                sortOrder,
                updatedBy,
            }
        );
    };

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export const deleteSubcategory =
    async (
        subcategoryId: string
    ): Promise<void> => {
        const id =
            ensureObjectId(
                subcategoryId,
                "subcategory ID"
            );

        const subcategory =
            await Subcategory.findById(
                id
            ).exec();

        if (!subcategory) {
            throw ApiError.notFound(
                "Subcategory not found.",
                {
                    code:
                        "SUBCATEGORY_NOT_FOUND",
                }
            );
        }

        const imagePublicId =
            subcategory.image
                ?.publicId;

        await Subcategory.deleteOne({
            _id: id,
        }).exec();

        if (imagePublicId) {
            try {
                await deleteFromCloudinary(
                    imagePublicId
                );
            } catch {
                // Database deletion succeeded.
            }
        }
    };

/*
|--------------------------------------------------------------------------
| Active Subcategories
|--------------------------------------------------------------------------
*/

export const listActiveSubcategories =
    async (
        categoryId?: string
    ): Promise<
        readonly SubcategoryDocument[]
    > => {
        const filter: Record<
            string,
            unknown
        > = {
            status: "ACTIVE",
        };

        if (categoryId) {
            filter.categoryId =
                ensureObjectId(
                    categoryId,
                    "category ID"
                );
        }

        const items =
            await Subcategory.find(
                filter
            )
                .sort({
                    sortOrder: 1,
                    name: 1,
                    _id: 1,
                })
                .lean()
                .exec();

        return items as unknown as readonly SubcategoryDocument[];
    };
