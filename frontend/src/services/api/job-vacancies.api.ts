import apiClient from "./client";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

import type {
    CreateJobVacancyInput,
    JobVacancy,
    JobVacancyListParams,
    UpdateJobVacancyInput,
    UpdateJobVacancyStatusInput,
} from "@/features/job-vacancies/job-vacancy.types";


interface BackendJobVacancyListResponse {
    data: JobVacancy[];
    pagination: PaginatedResponse<JobVacancy>["pagination"];
}


export const jobVacanciesApi = {
    async getAll(
        params?: JobVacancyListParams,
    ): Promise<PaginatedResponse<JobVacancy>> {
        const response =
            await apiClient.get<
                ApiResponse<JobVacancy[]> & {
                    pagination: BackendJobVacancyListResponse["pagination"];
                }
            >(
                "/job-vacancies",
                {
                    params,
                },
            );

        return {
            items: response.data.data,
            pagination: response.data.pagination,
        };
    },


    async getById(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.get<
                ApiResponse<JobVacancy>
            >(
                `/job-vacancies/${vacancyId}`,
            );

        return response.data.data;
    },


    async create(
        input: CreateJobVacancyInput,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancy>
            >(
                "/job-vacancies",
                input,
            );

        return response.data.data;
    },


    async update(
        vacancyId: string,
        input: UpdateJobVacancyInput,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.patch<
                ApiResponse<JobVacancy>
            >(
                `/job-vacancies/${vacancyId}`,
                input,
            );

        return response.data.data;
    },


    async updateStatus(
        vacancyId: string,
        input: UpdateJobVacancyStatusInput,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.patch<
                ApiResponse<JobVacancy>
            >(
                `/job-vacancies/${vacancyId}/status`,
                input,
            );

        return response.data.data;
    },


    async publish(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancy>
            >(
                `/job-vacancies/${vacancyId}/publish`,
            );

        return response.data.data;
    },


    async pause(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancy>
            >(
                `/job-vacancies/${vacancyId}/pause`,
            );

        return response.data.data;
    },


    async close(
        vacancyId: string,
    ): Promise<JobVacancy> {
        const response =
            await apiClient.post<
                ApiResponse<JobVacancy>
            >(
                `/job-vacancies/${vacancyId}/close`,
            );

        return response.data.data;
    },
};
