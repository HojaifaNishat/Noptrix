import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
    PeopleListParams,
    PeopleListResponse,
    PersonStatus,
} from "@/features/people/people.types";

interface UserListItem {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    status: PersonStatus;
    createdAt: string;
    lastLoginAt?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
}

interface UserListResponse {
    items: UserListItem[];
    pagination: PeopleListResponse["pagination"];
}

export const usersApi = {
    async getAll(params: PeopleListParams): Promise<PeopleListResponse> {
        const response = await apiClient.get<ApiResponse<UserListResponse>>(
            "/users",
            { params },
        );

        return {
            ...response.data.data,
            items: response.data.data.items.map((person) => ({
                id: person._id,
                name: person.name,
                ...(person.email ? { email: person.email } : {}),
                ...(person.phone ? { phone: person.phone } : {}),
                ...(person.avatarUrl ? { avatarUrl: person.avatarUrl } : {}),
                status: person.status,
                createdAt: person.createdAt,
                ...(person.lastLoginAt
                    ? { lastLoginAt: person.lastLoginAt }
                    : {}),
                isEmailVerified: person.isEmailVerified,
                isPhoneVerified: person.isPhoneVerified,
            })),
        };
    },

    async updateStatus(userId: string, status: PersonStatus): Promise<void> {
        await apiClient.patch<ApiResponse<unknown>>(`/users/${userId}/status`, {
            status,
        });
    },
};
