export const BRAND_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type BrandStatus = (typeof BRAND_STATUSES)[number];

export interface BrandLogoAsset {
    publicId: string;
    secureUrl: string;
    url: string;
    assetId: string;
    version: number;
    resourceType: "image";
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    originalFilename?: string;
}

export interface BrandSeo {
    title?: string;
    description?: string;
}

export interface Brand {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    logoAsset?: BrandLogoAsset;
    website?: string;
    status: BrandStatus;
    sortOrder: number;
    seo?: BrandSeo;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBrandInput {
    name: string;
    slug?: string;
    description?: string;
    logo?: string;
    logoFile?: File | null;
    website?: string;
    status?: BrandStatus;
    sortOrder?: number;
    seo?: BrandSeo;
}

export interface UpdateBrandInput {
    name?: string;
    slug?: string;
    description?: string;
    logo?: string;
    logoFile?: File | null;
    website?: string;
    status?: BrandStatus;
    sortOrder?: number;
    seo?: BrandSeo;
    removeLogo?: boolean;
}

export interface BrandListParams {
    search?: string;
    status?: BrandStatus;
    page?: number;
    limit?: number;
    sortBy?: "name" | "sortOrder" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

export interface BrandPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface BrandListResult {
    items: Brand[];
    pagination: BrandPagination;
}

export interface UpdateBrandStatusInput {
    status: BrandStatus;
}

export interface UpdateBrandSortOrderInput {
    sortOrder: number;
}
