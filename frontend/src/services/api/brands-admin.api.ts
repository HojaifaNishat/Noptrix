import apiClient from "./client";

import type { ApiResponse } from "@/types/api";

import type {
    Brand,
    BrandListParams,
    BrandListResult,
    CreateBrandInput,
    UpdateBrandInput,
    UpdateBrandStatusInput,
    UpdateBrandSortOrderInput,
} from "@/features/brands/brand.types";

function appendIfDefined(
    formData: FormData,
    key: string,
    value: unknown,
): void {
    if (value === undefined || value === null) {
        return;
    }

    if (typeof value === "object" && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
        return;
    }

    formData.append(key, String(value));
}

function createBrandFormData(input: CreateBrandInput): FormData {
    const formData = new FormData();

    appendIfDefined(formData, "name", input.name);
    appendIfDefined(formData, "slug", input.slug);
    appendIfDefined(formData, "description", input.description);
    appendIfDefined(formData, "website", input.website);
    appendIfDefined(formData, "status", input.status);
    appendIfDefined(formData, "sortOrder", input.sortOrder);
    appendIfDefined(formData, "seo", input.seo);

    if (input.logoFile) {
        formData.append("logo", input.logoFile);
    } else {
        appendIfDefined(formData, "logo", input.logo);
    }

    return formData;
}

function createUpdateBrandFormData(input: UpdateBrandInput): FormData {
    const formData = new FormData();

    appendIfDefined(formData, "name", input.name);
    appendIfDefined(formData, "slug", input.slug);
    appendIfDefined(formData, "description", input.description);
    appendIfDefined(formData, "website", input.website);
    appendIfDefined(formData, "status", input.status);
    appendIfDefined(formData, "sortOrder", input.sortOrder);
    appendIfDefined(formData, "seo", input.seo);
    appendIfDefined(formData, "removeLogo", input.removeLogo);

    if (input.logoFile) {
        formData.append("logo", input.logoFile);
    } else {
        appendIfDefined(formData, "logo", input.logo);
    }

    return formData;
}

export const brandsAdminApi = {
    async getAll(params?: BrandListParams): Promise<BrandListResult> {
        const response = await apiClient.get<
            ApiResponse<BrandListResult>
        >("/brands/admin", { params });

        return response.data.data;
    },

    async getById(brandId: string): Promise<Brand> {
        const response = await apiClient.get<ApiResponse<Brand>>(
            `/brands/${brandId}`,
        );

        return response.data.data;
    },

    async create(input: CreateBrandInput): Promise<Brand> {
        const response = await apiClient.post<ApiResponse<Brand>>(
            "/brands",
            createBrandFormData(input),
        );

        return response.data.data;
    },

    async update(
        brandId: string,
        input: UpdateBrandInput,
    ): Promise<Brand> {
        const response = await apiClient.patch<ApiResponse<Brand>>(
            `/brands/${brandId}`,
            createUpdateBrandFormData(input),
        );

        return response.data.data;
    },

    async updateStatus(
        brandId: string,
        input: UpdateBrandStatusInput,
    ): Promise<Brand> {
        const response = await apiClient.patch<ApiResponse<Brand>>(
            `/brands/${brandId}/status`,
            input,
        );

        return response.data.data;
    },

    async updateSortOrder(
        brandId: string,
        input: UpdateBrandSortOrderInput,
    ): Promise<Brand> {
        const response = await apiClient.patch<ApiResponse<Brand>>(
            `/brands/${brandId}/sort-order`,
            input,
        );

        return response.data.data;
    },

    async delete(brandId: string): Promise<void> {
        await apiClient.delete(`/brands/${brandId}`);
    },
};
