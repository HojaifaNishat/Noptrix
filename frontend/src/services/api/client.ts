import axios, {
    type AxiosError,
    type AxiosInstance,
    type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";

import {
    tokenStorage,
} from "@/lib/auth/token-storage";

/*
|--------------------------------------------------------------------------
| API Client
|--------------------------------------------------------------------------
*/

const apiClient: AxiosInstance = axios.create({
    baseURL: env.apiUrl,

    withCredentials: true,

    headers: {
        "Content-Type": "application/json",
    },

    timeout: 30_000,
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

apiClient.interceptors.request.use(
    (
        config: InternalAxiosRequestConfig,
    ) => {
        const accessToken =
            tokenStorage.get();

        if (accessToken) {
            config.headers.Authorization =
                `Bearer ${accessToken}`;
        }

        /*
        |--------------------------------------------------------------------------
        | FormData Handling
        |--------------------------------------------------------------------------
        | Let the browser automatically set the multipart boundary.
        */
        if (
            typeof FormData !== "undefined" &&
            config.data instanceof FormData
        ) {
            delete config.headers["Content-Type"];
        }

        return config;
    },

    (error: AxiosError) => {
        return Promise.reject(error);
    },
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error: AxiosError) => {
        return Promise.reject(error);
    },
);

export default apiClient;
