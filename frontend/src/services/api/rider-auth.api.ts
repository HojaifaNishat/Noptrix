import apiClient from "./client";

import type {
    AuthUser,
    LoginInput,
} from "@/types/auth";

import type {
    ApiResponse,
} from "@/types/api";

export interface RiderLoginResponse {
    riderId: string;
    userId: string;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
}

export interface RiderProfile extends AuthUser {
    riderId: string;
    riderCode?: string;
    riderStatus?: string;
    vehicleType?: string;
    vehicleNumber?: string;
}

let activeRefreshToken: string | null = null;
let activeSessionId: string | null = null;

export const riderSession = {
    set(response: RiderLoginResponse): void {
        activeRefreshToken = response.refreshToken;
        activeSessionId = response.sessionId;
    },

    getRefreshToken(): string | null {
        return activeRefreshToken;
    },

    getSessionId(): string | null {
        return activeSessionId;
    },

    clear(): void {
        activeRefreshToken = null;
        activeSessionId = null;
    },
};

export const riderAuthApi = {
    async login(
        input: LoginInput,
    ): Promise<RiderLoginResponse> {
        const response =
            await apiClient.post<
                ApiResponse<RiderLoginResponse>
            >(
                "/rider-auth/login",
                input,
            );

        const data = response.data.data;
        riderSession.set(data);

        return data;
    },

    async getMe(): Promise<RiderProfile> {
        const response =
            await apiClient.get<
                ApiResponse<RiderProfile>
            >(
                "/rider-auth/me",
            );

        return response.data.data;
    },

    async refresh(
        refreshToken: string,
    ): Promise<RiderLoginResponse> {
        const response =
            await apiClient.post<
                ApiResponse<RiderLoginResponse>
            >(
                "/rider-auth/refresh",
                { refreshToken },
            );

        const data = response.data.data;
        riderSession.set(data);

        return data;
    },

    async logout(
        sessionId?: string,
    ): Promise<void> {
        const id =
            sessionId ?? riderSession.getSessionId();

        try {
            if (id) {
                await apiClient.post(
                    "/rider-auth/logout",
                    { sessionId: id },
                );
            }
        } finally {
            riderSession.clear();
        }
    },
};
