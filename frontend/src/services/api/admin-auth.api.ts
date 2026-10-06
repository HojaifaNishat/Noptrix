import apiClient from "./client";

import type {
    AuthUser,
    LoginInput,
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
