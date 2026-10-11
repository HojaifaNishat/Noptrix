import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
    SettingsCategory,
    SettingsRecord,
} from "@/features/settings/settings.types";

interface SettingsResponseData {
    readonly settings: SettingsRecord;
}

interface AllSettingsResponseData {
    readonly settings: readonly SettingsRecord[];
}

export const settingsApi = {
    async getPublicBranding(): Promise<{
        readonly platformName?: string;
        readonly logoUrl?: string;
        readonly faviconUrl?: string;
    }> {
        const response =
            await apiClient.get<
                ApiResponse<{
                    settings: {
                        readonly platformName?: string;
                        readonly logoUrl?: string;
                        readonly faviconUrl?: string;
                    };
                }>
            >("/settings/public/general");

        return response.data.data.settings;
    },

    async getAll(): Promise<readonly SettingsRecord[]> {
        const response =
            await apiClient.get<
                ApiResponse<AllSettingsResponseData>
            >("/settings");

        return response.data.data.settings;
    },

    async getCategory(
        category: SettingsCategory,
    ): Promise<SettingsRecord> {
        const response =
            await apiClient.get<
                ApiResponse<SettingsResponseData>
            >(`/settings/${category}`);

        return response.data.data.settings;
    },

    async updateCategory(
        category: SettingsCategory,
        values: Record<string, unknown>,
    ): Promise<SettingsRecord> {
        const response =
            await apiClient.patch<
                ApiResponse<SettingsResponseData>
            >(
                `/settings/${category}`,
                { values },
            );

        return response.data.data.settings;
    },

    async uploadLogo(file: File): Promise<SettingsRecord> {
        const formData = new FormData();
        formData.append("image", file);

        const response = await apiClient.post<
            ApiResponse<SettingsResponseData>
        >("/settings/general/logo", formData);

        return response.data.data.settings;
    },
};
