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


export const customerAuthApi = {

    /*
    |--------------------------------------------------------------------------
    | Customer Login
    |--------------------------------------------------------------------------
    */

    async login(
        input: LoginInput,
    ): Promise<LoginResponse> {

        const response =
            await apiClient.post<
                ApiResponse<LoginResponse>
            >(
                "/user-auth/login",
                input,
            );

        return response.data.data;
    },


    /*
    |--------------------------------------------------------------------------
    | Customer Registration
    |--------------------------------------------------------------------------
    */

    async register(
        input: RegisterInput,
    ): Promise<LoginResponse> {

        const response =
            await apiClient.post<
                ApiResponse<LoginResponse>
            >(
                "/user-auth/register",
                input,
            );

        return response.data.data;
    },


    /*
    |--------------------------------------------------------------------------
    | Current Customer
    |--------------------------------------------------------------------------
    */

    async getMe(): Promise<AuthUser> {

        const response =
            await apiClient.get<
                ApiResponse<AuthUser>
            >(
                "/customers/me",
            );

        return response.data.data;
    },


    /*
    |--------------------------------------------------------------------------
    | Customer Logout
    |--------------------------------------------------------------------------
    */

    async logout(
        sessionId: string,
    ): Promise<void> {

        await apiClient.post(
            "/user-auth/logout",
            {
                sessionId,
            },
        );
    },
};
