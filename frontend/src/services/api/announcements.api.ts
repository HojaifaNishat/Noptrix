import apiClient from "./client";

import type {
    ApiResponse,
} from "@/types/api";

import type {
    Announcement,
    AnnouncementListResponse,
    AnnouncementQuery,
    CreateAnnouncementInput,
    UpdateAnnouncementInput,
} from "@/features/announcements/announcement.types";

const BASE_PATH = "/communication/announcements";

function normalizeId(id: string): string {
    const value = id.trim();

    if (!value) {
        throw new Error("Announcement ID is required.");
    }

    return encodeURIComponent(value);
}

export const announcementsApi = {
    async getAll(
        params: AnnouncementQuery = {},
    ): Promise<AnnouncementListResponse> {
        const response = await apiClient.get<
            ApiResponse<AnnouncementListResponse>
        >(BASE_PATH, { params });

        return response.data.data;
    },

    async getById(id: string): Promise<Announcement> {
        const response = await apiClient.get<
            ApiResponse<Announcement>
        >(`${BASE_PATH}/${normalizeId(id)}`);

        return response.data.data;
    },

    async create(
        input: CreateAnnouncementInput,
    ): Promise<Announcement> {
        const response = await apiClient.post<
            ApiResponse<Announcement>
        >(BASE_PATH, input);

        return response.data.data;
    },

    async update(
        id: string,
        input: UpdateAnnouncementInput,
    ): Promise<Announcement> {
        const response = await apiClient.patch<
            ApiResponse<Announcement>
        >(`${BASE_PATH}/${normalizeId(id)}`, input);

        return response.data.data;
    },

    async publish(id: string): Promise<Announcement> {
        const response = await apiClient.post<
            ApiResponse<Announcement>
        >(`${BASE_PATH}/${normalizeId(id)}/publish`);

        return response.data.data;
    },

    async archive(id: string): Promise<Announcement> {
        const response = await apiClient.patch<
            ApiResponse<Announcement>
        >(`${BASE_PATH}/${normalizeId(id)}/archive`);

        return response.data.data;
    },
};
