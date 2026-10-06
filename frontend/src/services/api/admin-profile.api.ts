import apiClient from "./client";

import type {
    ApiResponse,
} from "@/types/api";

import type {
    AdminProfile,
} from "@/types/profile";


export interface AdminAvatarResult {
    readonly avatarUrl: string;
    readonly avatarPublicId: string;
}


export const adminProfileApi = {

    async getMyProfile(): Promise<AdminProfile> {
        const response =
            await apiClient.get<
                ApiResponse<AdminProfile>
            >(
                "/admins/me/profile",
            );

        return response.data.data;
    },


    async uploadAvatar(
        file: File,
    ): Promise<AdminAvatarResult> {

        const formData =
            new FormData();

        formData.append(
            "image",
            file,
        );

        const response =
            await apiClient.post<
                ApiResponse<{
                    avatar: AdminAvatarResult;
                }>
            >(
                "/admins/me/avatar",
                formData,
            );

        return response.data.data.avatar;
    },


    async removeAvatar(): Promise<void> {
        await apiClient.delete(
            "/admins/me/avatar",
        );
    },
};
