import apiClient from "./client";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

/*
|--------------------------------------------------------------------------
| Category Types
|--------------------------------------------------------------------------
*/

export const CATEGORY_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    ARCHIVED: "ARCHIVED",
} as const;

export type CategoryStatus =
    (typeof CATEGORY_STATUSES)[keyof typeof CATEGORY_STATUSES];

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

export interface CategorySeo {
    readonly title?: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
}

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
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface CategoryListQuery {
    readonly search?: string;
    readonly status?: CategoryStatus;
    readonly isFeatured?: boolean;
    readonly page?: number;
    readonly limit?: number;
    readonly sortBy?:
        | "name"
        | "sortOrder"
        | "createdAt"
        | "updatedAt";
    readonly sortOrder?: "asc" | "desc";
}

export type CategoryListResponse =
    ApiResponse<
        PaginatedResponse<Category>
    >;

export type CategoryResponse =
    ApiResponse<Category>;

export type ActiveCategoriesResponse =
    ApiResponse<Category[]>;

/*
|--------------------------------------------------------------------------
| Category API
|--------------------------------------------------------------------------
*/

export const categoriesApi = {
    async list(
        query?: CategoryListQuery,
    ): Promise<CategoryListResponse> {
        const response =
            await apiClient.get<
                CategoryListResponse
            >("/categories", {
                params: query,
            });

        return response.data;
    },

    async listActive(): Promise<ActiveCategoriesResponse> {
        const response =
            await apiClient.get<
                ActiveCategoriesResponse
            >("/categories/active");

        return response.data;
    },

    async getBySlug(
        slug: string,
    ): Promise<CategoryResponse> {
        const response =
            await apiClient.get<
                CategoryResponse
            >(
                `/categories/slug/${encodeURIComponent(slug)}`,
            );

        return response.data;
    },
};
