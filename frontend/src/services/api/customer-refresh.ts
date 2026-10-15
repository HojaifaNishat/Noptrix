import axios from "axios";

import { env } from "@/config/env";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { ApiResponse } from "@/types/api";

interface CustomerRefreshResponse {
    accessToken: string;
}

const refreshClient = axios.create({
    baseURL: env.apiUrl,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30_000,
});

let refreshPromise: Promise<CustomerRefreshResponse> | null = null;

export function refreshCustomerAccessToken(): Promise<CustomerRefreshResponse> {
    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post<ApiResponse<CustomerRefreshResponse>>(
                "/user-auth/refresh",
                {},
            )
            .then(({ data: response }) => {
                const data = response.data;

                if (
                    !data ||
                    typeof data.accessToken !== "string" ||
                    !data.accessToken.trim()
                ) {
                    throw new Error(
                        "Customer refresh did not return a valid access token.",
                    );
                }

                tokenStorage.set(data.accessToken);

                return data;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}
