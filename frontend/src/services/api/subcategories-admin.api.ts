import apiClient from "./client";

import type {
    ApiResponse,
} from "@/types/api";

import type {
    Subcategory,
    SubcategoryListParams,
    SubcategoryListResult,
    CreateSubcategoryInput,
    UpdateSubcategoryInput,
    UpdateSubcategoryStatusInput,
    UpdateSubcategoryFeaturedInput,
    UpdateSubcategorySortOrderInput,
} from "@/features/subcategories/subcategory.types";

/*
|--------------------------------------------------------------------------
| FormData Helpers
|--------------------------------------------------------------------------
*/

function appendIfDefined(
    formData: FormData,
    key: string,
    value: unknown,
): void {
    if (value === undefined || value === null) {
        return;
    }

    if (
        typeof value === "object" &&
        !(value instanceof File)
    ) {
        formData.append(key, JSON.stringify(value));
        return;
    }

    formData.append(key, String(value));
}

function createSubcategoryFormData(
    input: CreateSubcategoryInput,
): FormData {
    const formData = new FormData();

    appendIfDefined(formData, "categoryId", input.categoryId);
    appendIfDefined(formData, "name", input.name);
    appendIfDefined(formData, "slug", input.slug);
    appendIfDefined(formData, "description", input.description);
    appendIfDefined(formData, "status", input.status);
    appendIfDefined(formData, "isFeatured", input.isFeatured);
    appendIfDefined(formData, "sortOrder", input.sortOrder);
    appendIfDefined(formData, "seo", input.seo);

    if (input.image) {
        formData.append("image", input.image);
    }

    return formData;
}

function createUpdateSubcategoryFormData(
    input: UpdateSubcategoryInput,
): FormData {
    const formData = new FormData();

    appendIfDefined(formData, "categoryId", input.categoryId);
    appendIfDefined(formData, "name", input.name);
    appendIfDefined(formData, "slug", input.slug);
    appendIfDefined(formData, "description", input.description);
    appendIfDefined(formData, "status", input.status);
    appendIfDefined(formData, "isFeatured", input.isFeatured);
    appendIfDefined(formData, "sortOrder", input.sortOrder);
    appendIfDefined(formData, "seo", input.seo);
    appendIfDefined(formData, "removeImage", input.removeImage);

    if (input.image) {
        formData.append("image", input.image);
    }

    return formData;
}

/*
|--------------------------------------------------------------------------
| Admin Subcategory API
|--------------------------------------------------------------------------
*/

export const subcategoriesAdminApi = {
    async getAll(
        params?: SubcategoryListParams,
    ): Promise<SubcategoryListResult> {
        const response = await apiClient.get<
            ApiResponse<SubcategoryListResult>
        >(
            "/subcategories",
            { params },
        );

        return response.data.data;
    },

    async getById(
        subcategoryId: string,
    ): Promise<Subcategory> {
        const response = await apiClient.get<
            ApiResponse<Subcategory>
        >(
            `/subcategories/${subcategoryId}`,
        );

        return response.data.data;
    },

    async getActive(
        categoryId?: string,
    ): Promise<Subcategory[]> {
        const response = await apiClient.get<
            ApiResponse<Subcategory[]>
        >(
            "/subcategories/active",
            {
                params: categoryId ? { categoryId } : undefined,
            },
        );

        return response.data.data;
    },

    async create(
        input: CreateSubcategoryInput,
    ): Promise<Subcategory> {
        const response = await apiClient.post<
            ApiResponse<Subcategory>
        >(
            "/subcategories",
            createSubcategoryFormData(input),
        );

        return response.data.data;
    },

    async update(
        subcategoryId: string,
        input: UpdateSubcategoryInput,
    ): Promise<Subcategory> {
        const response = await apiClient.patch<
            ApiResponse<Subcategory>
        >(
            `/subcategories/${subcategoryId}`,
            createUpdateSubcategoryFormData(input),
        );

        return response.data.data;
    },

    async updateStatus(
        subcategoryId: string,
        input: UpdateSubcategoryStatusInput,
    ): Promise<Subcategory> {
        const response = await apiClient.patch<
            ApiResponse<Subcategory>
        >(
            `/subcategories/${subcategoryId}/status`,
            input,
        );

        return response.data.data;
    },

    async updateFeatured(
        subcategoryId: string,
        input: UpdateSubcategoryFeaturedInput,
    ): Promise<Subcategory> {
        const response = await apiClient.patch<
            ApiResponse<Subcategory>
        >(
            `/subcategories/${subcategoryId}/featured`,
            input,
        );

        return response.data.data;
    },

    async updateSortOrder(
        subcategoryId: string,
        input: UpdateSubcategorySortOrderInput,
    ): Promise<Subcategory> {
        const response = await apiClient.patch<
            ApiResponse<Subcategory>
        >(
            `/subcategories/${subcategoryId}/sort-order`,
            input,
        );

        return response.data.data;
    },

    async delete(
        subcategoryId: string,
    ): Promise<void> {
        await apiClient.delete(
            `/subcategories/${subcategoryId}`,
        );
    },
};