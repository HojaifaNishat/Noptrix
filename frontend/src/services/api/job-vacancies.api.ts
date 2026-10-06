import apiClient from "./client";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

import type {
    CreateJobVacancyInput,
    JobVacancy,
    JobVacancyApiResponse,
    JobVacancyListParams,
    UpdateJobVacancyInput,
    UpdateJobVacancyStatusInput,
} from "@/features/job-vacancies/job-vacancy.types";

import {
    normalizeJobVacancy,
} from "@/features/job-vacancies/job-vacancy.types";


interface BackendJobVacancyListResponse {
    data: JobVacancyApiResponse[];
    pagination: PaginatedResponse<JobVacancy>["pagination"];
}


export const jobVacanciesApi = {
    async getAll(
        params?: JobVacancyListParams,
    ): Promise<PaginatedResponse<JobVacancy>> {
        const response =
            await apiClient.get<
                ApiResponse<JobVacancyApiResponse[]> & {
                    pagination: BackendJobVacancyListResponse["pagination"];
                }
            >(
                "/job-vacancies",
                {
                    params,
                },
            );

        return {
            items: response.data.data.map(
                normalizeJobVacancy,
            ),
            pagination: response.data.pagination,
        };
    },


    async getById(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.get<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/${vacancyId}`,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async getPublicBySlug(
        slug: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.get<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/public/${encodeURIComponent(slug)}`,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async create(
        input: CreateJobVacancyInput,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancyApiResponse>
            >(
                "/job-vacancies",
                input,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async update(
        vacancyId: string,
        input: UpdateJobVacancyInput,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.patch<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/${vacancyId}`,
                input,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async updateStatus(
        vacancyId: string,
        input: UpdateJobVacancyStatusInput,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.patch<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/${vacancyId}/status`,
                input,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async publish(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/${vacancyId}/publish`,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async pause(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/${vacancyId}/pause`,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async close(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancyApiResponse>
            >(
                `/job-vacancies/${vacancyId}/close`,
            );

        return normalizeJobVacancy(
            response.data.data,
        );
    },


    async delete(
        vacancyId: string,
    ): Promise<{
        vacancyId: string;
        deleted: boolean;
    }> {
        const response =
            await apiClient.delete<
                ApiResponse<{
                    vacancyId: string;
                    deleted: boolean;
                }>
            >(
                `/job-vacancies/${vacancyId}`,
            );

        return response.data.data;
    },
};
