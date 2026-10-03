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
| Category Image
|--------------------------------------------------------------------------
*/

export interface CategoryImage {
    readonly publicId: string;
    readonly secureUrl: string;
    readonly url: string;
    readonly assetId: string;
    readonly version: number;
    readonly resourceType: string;
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
    readonly keywords?: string[];
}


/*
|--------------------------------------------------------------------------
| Category
|--------------------------------------------------------------------------
*/

export interface Category {
    readonly _id: string;

    readonly name: string;
    readonly slug: string;

    readonly description?: string;

    readonly image?: CategoryImage;

    readonly status: CategoryStatus;

    readonly isFeatured: boolean;
    readonly sortOrder: number;

    readonly seo?: CategorySeo;

    readonly createdBy?: string;
    readonly updatedBy?: string;

    readonly createdAt: string;
    readonly updatedAt: string;
}


/*
|--------------------------------------------------------------------------
| Create
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

    readonly image?: File | null;
    readonly removeImage?: boolean;
}


/*
|--------------------------------------------------------------------------
| Update
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

    readonly image?: File | null;
    readonly removeImage?: boolean;
}


/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

export interface UpdateCategoryStatusInput {
    readonly status: CategoryStatus;
}


/*
|--------------------------------------------------------------------------
| Featured
|--------------------------------------------------------------------------
*/

export interface UpdateCategoryFeaturedInput {
    readonly isFeatured: boolean;
}


/*
|--------------------------------------------------------------------------
| Sort Order
|--------------------------------------------------------------------------
*/

export interface UpdateCategorySortOrderInput {
    readonly sortOrder: number;
}


/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

export interface CategoryListParams {
    readonly page?: number;
    readonly limit?: number;

    readonly search?: string;
    readonly status?: CategoryStatus;

    readonly isFeatured?: boolean;

    readonly sortBy?:
        | "name"
        | "sortOrder"
        | "createdAt"
        | "updatedAt";

    readonly sortOrder?: "asc" | "desc";
}


/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface CategoryPagination {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
}
