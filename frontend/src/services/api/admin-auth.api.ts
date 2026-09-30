import apiClient from "./client";

import type {
    AuthUser,
    LoginInput,
    LoginResponse,
} from "@/types/auth";

import type {
    ApiResponse,
} from "@/types/api";

export const adminAuthApi = {
    async login(
        input: LoginInput,
    ): Promise<LoginResponse> {
        const response =
            await apiClient.post<
                ApiResponse<LoginResponse>
            >(
                "/admin-auth/login",
                input,
            );

        return response.data.data;
    },

    async getMe(): Promise<AuthUser> {
        const response =
            await apiClient.get<
                ApiResponse<AuthUser>
            >(
                "/admin-auth/me",
            );

        return response.data.data;
    },

    async logout(): Promise<void> {
        await apiClient.post(
            "/admin-auth/logout",
        );
    },
};