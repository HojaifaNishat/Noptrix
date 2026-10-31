export const SUBCATEGORY_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    ARCHIVED: "ARCHIVED",
} as const;

export type SubcategoryStatus =
    (typeof SUBCATEGORY_STATUSES)[keyof typeof SUBCATEGORY_STATUSES];

export interface SubcategoryImage {
    publicId: string;
    secureUrl: string;
    url: string;
    assetId: string;
    version: number;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    originalFilename?: string;
}

export interface SubcategorySeo {
    title?: string;
    description?: string;
    keywords?: string[];
}

export interface Subcategory {
    _id: string;
    categoryId: string | {
        _id: string;
        name: string;
    };
    name: string;
    slug: string;
    description?: string;
    image?: SubcategoryImage;
    status: SubcategoryStatus;
    isFeatured: boolean;
    sortOrder: number;
    seo?: SubcategorySeo;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubcategoryInput {
    categoryId: string;
    name: string;
    slug?: string;
    description?: string;
    status?: SubcategoryStatus;
    isFeatured?: boolean;
    sortOrder?: number;
    seo?: SubcategorySeo;
    image?: File | null;
}

export interface UpdateSubcategoryInput {
    categoryId?: string;
    name?: string;
    slug?: string;
    description?: string;
    status?: SubcategoryStatus;
    isFeatured?: boolean;
    sortOrder?: number;
    seo?: SubcategorySeo;
    image?: File | null;
    removeImage?: boolean;
}

export interface SubcategoryListParams {
    categoryId?: string;
    search?: string;
    status?: SubcategoryStatus;
    isFeatured?: boolean;
    page?: number;
    limit?: number;
    sortBy?: "name" | "sortOrder" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

export interface SubcategoryPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface SubcategoryListResult {
    items: Subcategory[];
    pagination: SubcategoryPagination;
}

export interface UpdateSubcategoryStatusInput {
    status: SubcategoryStatus;
}

export interface UpdateSubcategoryFeaturedInput {
    isFeatured: boolean;
}

export interface UpdateSubcategorySortOrderInput {
    sortOrder: number;
}
