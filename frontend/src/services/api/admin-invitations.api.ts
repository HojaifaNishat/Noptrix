import apiClient from "./client";
import type { ApiResponse } from "@/types/api";

export interface AdminInvitationTarget {
    name: string;
    email: string;
    role?: {
        name?: string;
        slug?: string;
    } | null;
    status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
    expiresAt: string;
}

export interface CreatedAdminInvitation {
    invitationId: string;
    employeeId: string;
    email: string;
    name: string;
    roleId: string;
    roleName: string;
    expiresAt: string;
    token: string;
}

const BASE_PATH = "/admin-invitations";

export const adminInvitationsApi = {
    async create(input: {
        employeeId: string;
        roleId: string;
    }): Promise<CreatedAdminInvitation> {
        const response = await apiClient.post<ApiResponse<CreatedAdminInvitation>>(
            BASE_PATH,
            input,
        );
        return response.data.data;
    },

    async validateToken(token: string): Promise<AdminInvitationTarget> {
        const response = await apiClient.get<ApiResponse<AdminInvitationTarget>>(
            `${BASE_PATH}/validate`,
            { params: { token } },
        );
        return response.data.data;
    },

    async requestOtp(input: {
        token: string;
        channel: "EMAIL" | "PHONE";
    }): Promise<void> {
        await apiClient.post<ApiResponse<unknown>>(
            `${BASE_PATH}/accept/send-code`,
            input,
        );
    },

    async accept(input: {
        token: string;
        channel: "EMAIL" | "PHONE";
        code: string;
        password: string;
    }): Promise<{ email: string }> {
        const response = await apiClient.post<ApiResponse<{ email: string }>>(
            `${BASE_PATH}/accept`,
            input,
        );
        return response.data.data;
    },
};
