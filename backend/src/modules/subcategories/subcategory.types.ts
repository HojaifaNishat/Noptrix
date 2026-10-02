import type { Types } from "mongoose";
import type { UploadApiOptions } from "cloudinary";

export const SUBCATEGORY_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    ARCHIVED: "ARCHIVED",
} as const;

export type SubcategoryStatus =
    (typeof SUBCATEGORY_STATUSES)[keyof typeof SUBCATEGORY_STATUSES];

export interface SubcategoryImage {
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

export interface SubcategorySeo {
    readonly title?: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
}

export interface SubcategoryDocument {
    readonly _id: Types.ObjectId;
    readonly categoryId: Types.ObjectId;
    readonly name: string;
    readonly slug: string;
    readonly description?: string;
    readonly image?: SubcategoryImage;
    readonly status: SubcategoryStatus;
    readonly isFeatured: boolean;
    readonly sortOrder: number;
    readonly seo?: SubcategorySeo;
    readonly createdBy?: Types.ObjectId;
    readonly updatedBy?: Types.ObjectId;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface CreateSubcategoryInput {
    readonly categoryId: string;
    readonly name: string;
    readonly slug?: string;
    readonly description?: string;
    readonly status?: SubcategoryStatus;
    readonly isFeatured?: boolean;
    readonly sortOrder?: number;
    readonly seo?: SubcategorySeo;
    readonly createdBy?: string;
}

export interface UpdateSubcategoryInput {
    readonly categoryId?: string;
    readonly name?: string;
    readonly slug?: string;
    readonly description?: string;
    readonly status?: SubcategoryStatus;
    readonly isFeatured?: boolean;
    readonly sortOrder?: number;
    readonly seo?: SubcategorySeo;
    readonly updatedBy?: string;
}

export interface SubcategoryListFilters {
    readonly categoryId?: string;
    readonly search?: string;
    readonly status?: SubcategoryStatus;
    readonly isFeatured?: boolean;
}

export interface SubcategoryPagination {
    readonly page: number;
    readonly limit: number;
}

export interface SubcategoryListQuery
    extends SubcategoryListFilters,
        SubcategoryPagination {
    readonly sortBy?:
        | "name"
        | "sortOrder"
        | "createdAt"
        | "updatedAt";
    readonly sortOrder?: "asc" | "desc";
}

export interface SubcategoryListResult {
    readonly items: readonly SubcategoryDocument[];
    readonly pagination: {
        readonly page: number;
        readonly limit: number;
        readonly total: number;
        readonly totalPages: number;
        readonly hasNextPage: boolean;
        readonly hasPreviousPage: boolean;
    };
}
