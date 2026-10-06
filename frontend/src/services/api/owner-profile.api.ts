import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { OwnerProfile } from "@/types/profile";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface OwnerAvatar {
    readonly avatarUrl: string;
    readonly avatarPublicId: string;
}

interface OwnerAvatarResponse {
    readonly avatar: OwnerAvatar;
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const ownerProfileApi = {
    async getMyProfile(): Promise<OwnerProfile> {
        const response =
            await apiClient.get<
                ApiResponse<OwnerProfile>
            >(
                "/owners/me",
            );

        return response.data.data;
    },

    async uploadAvatar(
        file: File,
    ): Promise<OwnerAvatar> {
        const formData =
            new FormData();

        formData.append(
            "image",
            file,
        );

        const response =
            await apiClient.post<
                ApiResponse<OwnerAvatarResponse>
            >(
                "/owners/me/avatar",
                formData,
            );

        return response.data.data.avatar;
    },

    async removeAvatar(): Promise<void> {
        await apiClient.delete(
            "/owners/me/avatar",
        );
    },
};
