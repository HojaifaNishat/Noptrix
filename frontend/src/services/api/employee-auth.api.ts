import apiClient from "./client";
import type {
  AuthUser,
  LoginAttemptResponse,
  LoginInput,
  LoginResponse,
  LoginVerificationInput,
} from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export interface EmployeeRefreshResponse {
  readonly accessToken: string;
  readonly user: AuthUser;
  readonly userId: string;
  readonly adminId: string;
  readonly sessionId: string;
  readonly secretVerified: boolean;
}

export const employeeAuthApi = {
  async login(input: LoginInput): Promise<LoginAttemptResponse> {
    const response = await apiClient.post<ApiResponse<LoginAttemptResponse>>(
      "/employee-auth/login",
      input,
    );

    return response.data.data;
  },

  async verifyLogin(input: LoginVerificationInput): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/employee-auth/verify-login",
      input,
    );

    return response.data.data;
  },

  async resendLoginCode(challengeId: string): Promise<LoginAttemptResponse> {
    const response = await apiClient.post<ApiResponse<LoginAttemptResponse>>(
      "/employee-auth/resend-login-code",
      { challengeId },
    );

    return response.data.data;
  },

  async refresh(): Promise<EmployeeRefreshResponse> {
    const response = await apiClient.post<ApiResponse<EmployeeRefreshResponse>>(
      "/employee-auth/refresh",
      {},
    );

    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/employee-auth/logout");
  },
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(
      "/employee-auth/forgot-password",
      { email: email.trim().toLowerCase() },
    );
  },

  async resetPassword(input: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post(
      "/employee-auth/reset-password",
      {
        email: input.email.trim().toLowerCase(),
        code: input.code.trim(),
        newPassword: input.newPassword,
      },
    );
  },

};
