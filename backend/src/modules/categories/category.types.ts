import type { Types } from "mongoose";
import type { UploadApiOptions } from "cloudinary";

/*
|--------------------------------------------------------------------------
| Category Status
|--------------------------------------------------------------------------
*/

export const CATEGORY_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    ARCHIVED: "ARCHIVED",
} as const;

export type CategoryStatus =
    (typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES];

/*
|--------------------------------------------------------------------------
| Cloudinary Category Image
|--------------------------------------------------------------------------
*/

export interface CategoryImage {
    readonly publicId: string;
    readonly secureUrl: string;
    readonly url: string;
    readonly assetId: string;
    readonly version: number;
    readonly resourceType: UploadApiOptions["resource_type"];
    readonly format: string;
    readonly bytes: number;
    readonly width?: number;
    readonly height?: number;
    readonly originalFilename?: string;
}

/*
|--------------------------------------------------------------------------
| Category SEO
|--------------------------------------------------------------------------
*/

export interface CategorySeo {
    readonly title?: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
}

/*
|--------------------------------------------------------------------------
| Category Document
|--------------------------------------------------------------------------
*/

export interface CategoryDocument {
    readonly _id: Types.ObjectId;

    readonly name: string;
    readonly slug: string;

    readonly description?: string;

    readonly image?: CategoryImage;

    readonly status: CategoryStatus;

    readonly isFeatured: boolean;
    readonly sortOrder: number;

    readonly seo?: CategorySeo;

    readonly createdBy?: Types.ObjectId;
    readonly updatedBy?: Types.ObjectId;

    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
|
| Image is intentionally excluded.
| The service creates it from CloudinaryUploadResult.
|
|--------------------------------------------------------------------------
*/

export interface CreateCategoryInput {
    readonly name: string;
    readonly slug?: string;
    readonly description?: string;

    readonly status?: CategoryStatus;

    readonly isFeatured?: boolean;
    readonly sortOrder?: number;

    readonly seo?: CategorySeo;

    readonly createdBy?: string;
}

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
|
| Image is intentionally excluded.
| Image replacement/removal will be handled explicitly
| by the service through Cloudinary.
|
|--------------------------------------------------------------------------
*/

export interface UpdateCategoryInput {
    readonly name?: string;
    readonly slug?: string;
    readonly description?: string;

    readonly status?: CategoryStatus;

    readonly isFeatured?: boolean;
    readonly sortOrder?: number;

    readonly seo?: CategorySeo;

    readonly updatedBy?: string;
}

/*
|--------------------------------------------------------------------------
| Category List Filters
|--------------------------------------------------------------------------
*/

export interface CategoryListFilters {
    readonly search?: string;
    readonly status?: CategoryStatus;
    readonly isFeatured?: boolean;
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface CategoryPagination {
    readonly page: number;
    readonly limit: number;
}

/*
|--------------------------------------------------------------------------
| Category List Query
|--------------------------------------------------------------------------
*/

export interface CategoryListQuery
    extends CategoryListFilters,
        CategoryPagination {
    readonly sortBy?:
        | "name"
        | "sortOrder"
        | "createdAt"
        | "updatedAt";

    readonly sortOrder?:
        | "asc"
        | "desc";
}

/*
|--------------------------------------------------------------------------
| Category List Result
|--------------------------------------------------------------------------
*/

export interface CategoryListResult {
    readonly items:
        readonly CategoryDocument[];

    readonly pagination: {
        readonly page: number;
        readonly limit: number;
        readonly total: number;
        readonly totalPages: number;
        readonly hasNextPage: boolean;
        readonly hasPreviousPage: boolean;
    };
}
