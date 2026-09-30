import apiClient from "./client";

import type {
    LoginInput,
} from "@/types/auth";

import type {
    ApiResponse,
} from "@/types/api";

/*
|--------------------------------------------------------------------------
| Owner Authentication Response
|--------------------------------------------------------------------------
*/

export interface OwnerAuthenticationResponse {
    userId: string;
    ownerId: string;
    sessionId: string;
    accessToken: string;
    secretVerified: boolean;
}

/*
|--------------------------------------------------------------------------
| Owner Secret Verification Input
|--------------------------------------------------------------------------
*/

export interface OwnerVerifySecretInput {
    secretCode: string;
}

/*
|--------------------------------------------------------------------------
| Owner Auth API
|--------------------------------------------------------------------------
*/

export const ownerAuthApi = {

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    async login(
        input: LoginInput,
    ): Promise<OwnerAuthenticationResponse> {

        const response =
            await apiClient.post<
                ApiResponse<OwnerAuthenticationResponse>
            >(
                "/owner-auth/login",
                input,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Verify Secret
    |--------------------------------------------------------------------------
    */

    async verifySecret(
        input: OwnerVerifySecretInput,
    ): Promise<OwnerAuthenticationResponse> {

        const response =
            await apiClient.post<
                ApiResponse<OwnerAuthenticationResponse>
            >(
                "/owner-auth/verify-secret",
                input,
            );

        return response.data.data;
    },

    /*
    |--------------------------------------------------------------------------
    | Refresh Access Token
    |--------------------------------------------------------------------------
    */

    async refresh(): Promise<OwnerAuthenticationResponse> {

        const response =
            await apiClient.post<
                ApiResponse<OwnerAuthenticationResponse>
            >(
                "/owner-auth/refresh",
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
            "/owner-auth/logout",
        );
    },
};