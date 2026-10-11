import apiClient from "./client";

import type {
    AuthUser,
    LoginVerificationInput,
    LoginInput,
    LoginAttemptResponse,
    LoginResponse,
} from "@/types/auth";

import type {
    ApiResponse,
} from "@/types/api";


/*
|--------------------------------------------------------------------------
| Admin Refresh Response
|--------------------------------------------------------------------------
*/

export interface AdminRefreshResponse {
    readonly accessToken: string;
    readonly user: AuthUser;
    readonly userId: string;
    readonly adminId: string;
    readonly sessionId: string;
    readonly secretVerified: boolean;
}


/*
|--------------------------------------------------------------------------
| Admin Authentication API
|--------------------------------------------------------------------------
*/

export const adminAuthApi = {

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    async login(
        input: LoginInput,
    ): Promise<LoginAttemptResponse> {

        const response =
            await apiClient.post<
                ApiResponse<LoginAttemptResponse>
            >(
                "/admin-auth/login",
                input,
            );

        return response.data.data;
    },

    async verifyLogin(
        input: LoginVerificationInput,
    ): Promise<LoginResponse> {
        const response =
            await apiClient.post<ApiResponse<LoginResponse>>(
                "/admin-auth/verify-login",
                input,
            );

        return response.data.data;
    },

    async resendLoginCode(
        challengeId: string,
    ): Promise<LoginAttemptResponse> {
        const response =
            await apiClient.post<ApiResponse<LoginAttemptResponse>>(
                "/admin-auth/resend-login-code",
                { challengeId },
            );

        return response.data.data;
    },


    /*
    |--------------------------------------------------------------------------
    | Forgot Password
    |--------------------------------------------------------------------------
    */

    async forgotPassword(email: string): Promise<void> {
        await apiClient.post(
            "/admin-auth/forgot-password",
            { email: email.trim().toLowerCase() },
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Reset Password
    |--------------------------------------------------------------------------
    */

    async resetPassword(input: {
        email: string;
        code: string;
        newPassword: string;
    }): Promise<void> {
        await apiClient.post(
            "/admin-auth/reset-password",
            {
                email: input.email.trim().toLowerCase(),
                code: input.code.trim(),
                newPassword: input.newPassword,
            },
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Refresh
    |--------------------------------------------------------------------------
    |
    | The refresh token is intentionally NOT passed
    | from JavaScript. Axios sends the httpOnly cookie
    | automatically because the API client uses
    | withCredentials: true.
    |
    */

    async refresh(): Promise<AdminRefreshResponse> {

        const response =
            await apiClient.post<
                ApiResponse<AdminRefreshResponse>
            >(
                "/admin-auth/refresh",
                {},
            );

        return response.data.data;
    },


    /*
    |--------------------------------------------------------------------------
    | Current Admin
    |--------------------------------------------------------------------------
    */

    async getMe(): Promise<AuthUser> {

        const response =
            await apiClient.get<
                ApiResponse<AuthUser>
            >(
                "/admin-auth/me",
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
            "/admin-auth/logout",
        );
    },
};
