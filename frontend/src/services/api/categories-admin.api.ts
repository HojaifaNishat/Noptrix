import apiClient from "./client";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

import type {
    Category,
    CategoryListParams,
    CreateCategoryInput,
    UpdateCategoryFeaturedInput,
    UpdateCategoryInput,
    UpdateCategorySortOrderInput,
    UpdateCategoryStatusInput,
} from "@/features/categories/category.types";


/*
|--------------------------------------------------------------------------
| Backend List Response
|--------------------------------------------------------------------------
*/

interface BackendCategoryListResponse {
    data: Category[];
    pagination: PaginatedResponse<Category>["pagination"];
}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function appendIfDefined(
    formData: FormData,
    key: string,
    value: unknown,
): void {
    if (
        value === undefined ||
        value === null
    ) {
        return;
    }

    if (
        typeof value === "object" &&
        !(value instanceof File)
    ) {
        formData.append(
            key,
            JSON.stringify(value),
        );

        return;
    }

    formData.append(
        key,
        String(value),
    );
}


function createCategoryFormData(
    input: CreateCategoryInput,
): FormData {
    const formData =
        new FormData();

    appendIfDefined(
        formData,
        "name",
        input.name,
    );

    appendIfDefined(
        formData,
        "slug",
        input.slug,
    );

    appendIfDefined(
        formData,
        "description",
        input.description,
    );

    appendIfDefined(
        formData,
        "status",
        input.status,
    );

    appendIfDefined(
        formData,
        "isFeatured",
        input.isFeatured,
    );

    appendIfDefined(
        formData,
        "sortOrder",
        input.sortOrder,
    );

    appendIfDefined(
        formData,
        "seo",
        input.seo,
    );

    appendIfDefined(
        formData,
        "removeImage",
        input.removeImage,
    );

    if (input.image) {
        formData.append(
            "image",
            input.image,
        );
    }

    return formData;
}


function createUpdateCategoryFormData(
    input: UpdateCategoryInput,
): FormData {
    const formData =
        new FormData();

    appendIfDefined(
        formData,
        "name",
        input.name,
    );

    appendIfDefined(
        formData,
        "slug",
        input.slug,
    );

    appendIfDefined(
        formData,
        "description",
        input.description,
    );

    appendIfDefined(
        formData,
        "status",
        input.status,
    );

    appendIfDefined(
        formData,
        "isFeatured",
        input.isFeatured,
    );

    appendIfDefined(
        formData,
        "sortOrder",
        input.sortOrder,
    );

    appendIfDefined(
        formData,
        "seo",
        input.seo,
    );

    appendIfDefined(
        formData,
        "removeImage",
        input.removeImage,
    );

    if (input.image) {
        formData.append(
            "image",
            input.image,
        );
    }

    return formData;
}


/*
|--------------------------------------------------------------------------
| Admin Category API
|--------------------------------------------------------------------------
*/

export const categoriesAdminApi = {
    async getAll(
        params?: CategoryListParams,
    ): Promise<
        PaginatedResponse<Category>
    > {
        const response =
            await apiClient.get<
                ApiResponse<Category[]> & {
                    meta:
                        BackendCategoryListResponse["pagination"];
                }
            >(
                "/categories",
                {
                    params,
                },
            );

        return {
            items: response.data.data,
            pagination:
                response.data.meta,
        };
    },


    async getById(
        categoryId: string,
    ): Promise<Category> {
        const response =
            await apiClient.get<
                ApiResponse<Category>
            >(
                `/categories/${categoryId}`,
            );

        return response.data.data;
    },


    async create(
        input: CreateCategoryInput,
    ): Promise<Category> {
        const formData =
            createCategoryFormData(input);

        const response =
            await apiClient.post<
                ApiResponse<Category>
            >(
                "/categories",
                formData,
            );

        return response.data.data;
    },


    async update(
        categoryId: string,
        input: UpdateCategoryInput,
    ): Promise<Category> {
        const formData =
            createUpdateCategoryFormData(
                input,
            );

        const response =
            await apiClient.patch<
                ApiResponse<Category>
            >(
                `/categories/${categoryId}`,
                formData,
            );

        return response.data.data;
    },


    async updateStatus(
        categoryId: string,
        input: UpdateCategoryStatusInput,
    ): Promise<Category> {
        const response =
            await apiClient.patch<
                ApiResponse<Category>
            >(
                `/categories/${categoryId}/status`,
                input,
            );

        return response.data.data;
    },


    async updateFeatured(
        categoryId: string,
        input: UpdateCategoryFeaturedInput,
    ): Promise<Category> {
        const response =
            await apiClient.patch<
                ApiResponse<Category>
            >(
                `/categories/${categoryId}/featured`,
                input,
            );

        return response.data.data;
    },


    async updateSortOrder(
        categoryId: string,
        input: UpdateCategorySortOrderInput,
    ): Promise<Category> {
        const response =
            await apiClient.patch<
                ApiResponse<Category>
            >(
                `/categories/${categoryId}/sort-order`,
                input,
            );

        return response.data.data;
    },


    async delete(
        categoryId: string,
    ): Promise<void> {
        await apiClient.delete(
            `/categories/${categoryId}`,
        );
    },
};
