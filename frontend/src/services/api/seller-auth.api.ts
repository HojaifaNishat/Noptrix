import apiClient from "./client";

import type {
    AuthUser,
    LoginInput,
    LoginResponse,
} from "@/types/auth";

import type {
    ApiResponse,
} from "@/types/api";

export const sellerAuthApi = {
    async login(
        input: LoginInput,
    ): Promise<LoginResponse> {
        const response =
            await apiClient.post<
                ApiResponse<LoginResponse>
            >(
                "/seller-auth/login",
                input,
            );

        return response.data.data;
    },

    async getMe(): Promise<AuthUser> {
        const response =
            await apiClient.get<
                ApiResponse<AuthUser>
            >(
                "/seller-auth/me",
            );

        return response.data.data;
    },

    async logout(): Promise<void> {
        await apiClient.post(
            "/seller-auth/logout",
        );
    },
};