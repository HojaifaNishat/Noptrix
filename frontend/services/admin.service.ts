import apiClient from "@/lib/api/client";

export type AdminLoginResponse = {
    userId: string;
    adminId: string;
    roleId: string;
    role: string;
    sessionId: string;
    secretVerified: boolean;
    tokens: { accessToken: string; refreshToken: string };
};

export const adminAuthService = {
    async login(credentials: { email: string; password: string }) {
        const response = await apiClient.post<{ data: AdminLoginResponse }>("/admin-auth/login", credentials);
        return response.data;
    },

    async refreshToken(refreshToken: string) {
        const response = await apiClient.post<{ data: { accessToken: string; refreshToken: string } }>("/admin-auth/refresh", { refreshToken });
        return response.data;
    },

    async logout() {
        const response = await apiClient.post("/admin-auth/logout");
        return response.data;
    },
};
