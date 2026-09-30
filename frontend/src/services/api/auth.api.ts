import apiClient from "./client";

import type {
    AuthUser,
    LoginInput,
    LoginResponse,
    RegisterInput,
} from "@/types/auth";

import type {
    ApiResponse,
} from "@/types/api";

/*
|--------------------------------------------------------------------------
| Authentication API
|--------------------------------------------------------------------------
*/

export const authApi = {
    /*
    |--------------------------------------------------------------------------
    | Current Session
    |--------------------------------------------------------------------------
    */

    async getMe(): Promise<AuthUser> {
        const response =
            await apiClient.get<
                ApiResponse<AuthUser>
            >("/auth/me");

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    async login(
        input: LoginInput,
    ): Promise<LoginResponse> {
        const response =
            await apiClient.post<
                ApiResponse<LoginResponse>
            >(
                "/auth/login",
                input,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Register
    |--------------------------------------------------------------------------
    */

    async register(
        input: RegisterInput,
    ): Promise<LoginResponse> {
        const response =
            await apiClient.post<
                ApiResponse<LoginResponse>
            >(
                "/auth/register",
                input,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    async logout(): Promise<void> {
        await apiClient.post(
            "/auth/logout",
        );
    },
};