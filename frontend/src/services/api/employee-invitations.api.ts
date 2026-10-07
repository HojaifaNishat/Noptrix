import apiClient from "./client";

import type {
    ApiResponse,
} from "@/types/api";

import type {
    CreateEmployeeInvitationInput,
    CreateEmployeeInvitationResult,
    AcceptEmployeeInvitationInput,
    AcceptEmployeeInvitationResult,
    EmployeeInvitation,
    EmployeeInvitationQuery,
    EmployeeInvitationListResponse,
} from "@/features/invitations/invitation.types";

const EMPLOYEE_INVITATION_BASE_PATH =
    "/employee-invitations";

export const employeeInvitationsApi = {
    async create(
        input: CreateEmployeeInvitationInput,
    ): Promise<CreateEmployeeInvitationResult> {
        const response =
            await apiClient.post<
                ApiResponse<CreateEmployeeInvitationResult>
            >(
                EMPLOYEE_INVITATION_BASE_PATH,
                input,
            );

        return response.data.data;
    },

    async getAll(
        params?: EmployeeInvitationQuery,
    ): Promise<EmployeeInvitationListResponse> {
        const response =
            await apiClient.get<
                ApiResponse<EmployeeInvitationListResponse>
            >(
                EMPLOYEE_INVITATION_BASE_PATH,
                {
                    params,
                },
            );

        return response.data.data;
    },

    async getById(
        invitationId: string,
    ): Promise<EmployeeInvitation> {
        const normalizedId =
            invitationId.trim();

        if (!normalizedId) {
            throw new Error(
                "Invitation ID is required.",
            );
        }

        const response =
            await apiClient.get<
                ApiResponse<EmployeeInvitation>
            >(
                `${EMPLOYEE_INVITATION_BASE_PATH}/${encodeURIComponent(
                    normalizedId,
                )}`,
            );

        return response.data.data;
    },

    async validateToken(
        token: string,
    ): Promise<EmployeeInvitation> {
        const normalizedToken =
            token.trim();

        if (!normalizedToken) {
            throw new Error(
                "Invitation token is required.",
            );
        }

        const response =
            await apiClient.get<
                ApiResponse<EmployeeInvitation>
            >(
                `${EMPLOYEE_INVITATION_BASE_PATH}/validate`,
                {
                    params: {
                        token: normalizedToken,
                    },
                },
            );

        return response.data.data;
    },

    async accept(
        input: AcceptEmployeeInvitationInput,
    ): Promise<AcceptEmployeeInvitationResult> {
        const token =
            input.token.trim();

        if (!token) {
            throw new Error(
                "Invitation token is required.",
            );
        }

        const response =
            await apiClient.post<
                ApiResponse<AcceptEmployeeInvitationResult>
            >(
                `${EMPLOYEE_INVITATION_BASE_PATH}/accept`,
                {
                    token,
                },
            );

        return response.data.data;
    },

    async revoke(
        invitationId: string,
    ): Promise<EmployeeInvitation> {
        const normalizedId =
            invitationId.trim();

        if (!normalizedId) {
            throw new Error(
                "Invitation ID is required.",
            );
        }

        const response =
            await apiClient.post<
                ApiResponse<EmployeeInvitation>
            >(
                `${EMPLOYEE_INVITATION_BASE_PATH}/${encodeURIComponent(
                    normalizedId,
                )}/revoke`,
            );

        return response.data.data;
    },
};

export const createEmployeeInvitation =
    employeeInvitationsApi.create;

export const getEmployeeInvitations =
    employeeInvitationsApi.getAll;

export const getEmployeeInvitation =
    employeeInvitationsApi.getById;

export const validateEmployeeInvitation =
    employeeInvitationsApi.validateToken;

export const acceptEmployeeInvitation =
    employeeInvitationsApi.accept;

export const revokeEmployeeInvitation =
    employeeInvitationsApi.revoke;

export default employeeInvitationsApi;
