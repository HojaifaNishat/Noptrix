import apiClient from "./client";

import type {
    AuthUser,
    LoginInput,
    LoginResponse,
    RegistrationResponse,
    EmailVerificationInput,
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
    ): Promise<RegistrationResponse> {

        const response =
            await apiClient.post<
                ApiResponse<RegistrationResponse>
            >(
                "/user-auth/register",
                input,
            );

        return response.data.data;
    },


    /*
    |--------------------------------------------------------------------------
    | Verify Customer Email
    |--------------------------------------------------------------------------
    */

    async verifyEmail(
        input: EmailVerificationInput,
    ): Promise<void> {
        await apiClient.post(
            "/user-auth/verify-email",
            input,
        );
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
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(
      "/user-auth/forgot-password",
      { email: email.trim().toLowerCase() },
    );
  },

  async resetPassword(input: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post(
      "/user-auth/reset-password",
      {
        email: input.email.trim().toLowerCase(),
        code: input.code.trim(),
        newPassword: input.newPassword,
      },
    );
  },

};
