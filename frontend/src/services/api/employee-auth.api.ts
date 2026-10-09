import apiClient from "./client";
import type { AuthUser, LoginInput, LoginResponse } from "@/types/auth";
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
  async login(input: LoginInput): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/employee-auth/login",
      input,
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
};
