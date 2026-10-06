import type { Types } from "mongoose";

/*
|--------------------------------------------------------------------------
| Product Status
|--------------------------------------------------------------------------
*/

export const PRODUCT_STATUSES = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    ARCHIVED: "ARCHIVED",
} as const;

export type ProductStatus =
    (typeof PRODUCT_STATUSES)[keyof typeof PRODUCT_STATUSES];

/*
|--------------------------------------------------------------------------
| Product Type
|--------------------------------------------------------------------------
*/

export const PRODUCT_TYPES = {
    SIMPLE: "SIMPLE",
    VARIABLE: "VARIABLE",
    DIGITAL: "DIGITAL",
    SERVICE: "SERVICE",
} as const;

export type ProductType =
    (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];

/*
|--------------------------------------------------------------------------
| Inventory Policy
|--------------------------------------------------------------------------
*/

export const INVENTORY_POLICIES = {
    TRACK: "TRACK",
    DONT_TRACK: "DONT_TRACK",
} as const;

export type InventoryPolicy =
    (typeof INVENTORY_POLICIES)[keyof typeof INVENTORY_POLICIES];

/*
|--------------------------------------------------------------------------
| Product Image Reference
|--------------------------------------------------------------------------
*/

export interface ProductImageReference {
    readonly imageId: Types.ObjectId;
}

/*
|--------------------------------------------------------------------------
| Product SEO
|--------------------------------------------------------------------------
*/

export interface ProductSeo {
    readonly title?: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
}

/*
|--------------------------------------------------------------------------
| Product Shipping
|--------------------------------------------------------------------------
*/

export interface ProductShipping {
    readonly requiresShipping: boolean;
    readonly weight?: number;
    readonly weightUnit?: "g" | "kg";
    readonly length?: number;
    readonly width?: number;
    readonly height?: number;
    readonly dimensionUnit?: "cm" | "m";
}

/*
|--------------------------------------------------------------------------
| Product Document
|--------------------------------------------------------------------------
*/

export interface ProductData {
    readonly _id: Types.ObjectId;

    readonly name: string;
    readonly slug: string;

    readonly type: ProductType;

    readonly shortDescription?: string;
    readonly description?: string;

    readonly categoryId: Types.ObjectId;
    readonly subcategoryId?: Types.ObjectId;

    readonly brandId?: Types.ObjectId;
    readonly collectionIds: readonly Types.ObjectId[];

    readonly status: ProductStatus;

    readonly isFeatured: boolean;

    readonly sku?: string;

    readonly barcode?: string;

    readonly inventoryPolicy: InventoryPolicy;

    readonly hasVariants: boolean;

    readonly defaultImageId?: Types.ObjectId;

    readonly seo?: ProductSeo;

    readonly shipping: ProductShipping;

    readonly createdBy?: Types.ObjectId;
    readonly updatedBy?: Types.ObjectId;

    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Create Input
|--------------------------------------------------------------------------
*/

export interface CreateProductInput {
    readonly name: string;
    readonly slug?: string;

    readonly type?: ProductType;

    readonly shortDescription?: string;
    readonly description?: string;

    readonly categoryId: string;
    readonly subcategoryId?: string;

    readonly brandId?: string;
    readonly collectionIds?: readonly string[];

    readonly status?: ProductStatus;

    readonly isFeatured?: boolean;

    readonly sku?: string;
    readonly barcode?: string;

    readonly inventoryPolicy?: InventoryPolicy;

    readonly hasVariants?: boolean;

    readonly defaultImageId?: string;

    readonly seo?: ProductSeo;

    readonly shipping?: ProductShipping;

    readonly createdBy?: string;
}

/*
|--------------------------------------------------------------------------
| Update Input
|--------------------------------------------------------------------------
*/

export interface UpdateProductInput {
    readonly name?: string;
    readonly slug?: string;

    readonly type?: ProductType;

    readonly shortDescription?: string;
    readonly description?: string;

    readonly categoryId?: string;
    readonly subcategoryId?: string | null;

    readonly brandId?: string | null;
    readonly collectionIds?: readonly string[];

    readonly status?: ProductStatus;

    readonly isFeatured?: boolean;

    readonly sku?: string | null;
    readonly barcode?: string | null;

    readonly inventoryPolicy?: InventoryPolicy;

    readonly hasVariants?: boolean;

    readonly defaultImageId?: string | null;

    readonly seo?: ProductSeo;

    readonly shipping?: ProductShipping;

    readonly updatedBy?: string;
}

/*
|--------------------------------------------------------------------------
| List Filters
|--------------------------------------------------------------------------
*/

export interface ProductListFilters {
    readonly search?: string;
    readonly categoryId?: string;
    readonly subcategoryId?: string;
    readonly brandId?: string;
    readonly status?: ProductStatus;
    readonly type?: ProductType;
    readonly isFeatured?: boolean;
    readonly hasVariants?: boolean;
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface ProductPagination {
    readonly page: number;
    readonly limit: number;
}

export interface ProductListQuery
    extends ProductListFilters,
        ProductPagination {
    readonly sortBy?:
        | "name"
        | "createdAt"
        | "updatedAt";

    readonly sortOrder?: "asc" | "desc";
}

export interface ProductListResult {
    readonly items: readonly ProductData[];

    readonly pagination: {
        readonly page: number;
        readonly limit: number;
        readonly total: number;
        readonly totalPages: number;
        readonly hasNextPage: boolean;
        readonly hasPreviousPage: boolean;
    };
}
