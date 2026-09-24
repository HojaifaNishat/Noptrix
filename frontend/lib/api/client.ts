import axios from "axios";

// Apnar backend base URL (env theke hobe, na thakle default localhost)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Cookies ba token handle korar jonno
});

// Request Interceptor: Token attach korar jonno
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("adminAccessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Error ba token expire handle korar jonno
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Jodi 401 (Unauthorized) hoy ebong retry na kora hoye thake
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("adminRefreshToken");
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/admin-auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: rotatedRefreshToken } = response.data.data;
                    localStorage.setItem("adminAccessToken", accessToken);
                    if (rotatedRefreshToken) localStorage.setItem("adminRefreshToken", rotatedRefreshToken);

                    // Original request-ti abar new token diye dispatch kora
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh token fail korle logout kore login page e pathiye dewa
                if (typeof window !== "undefined") {
                    localStorage.removeItem("adminAccessToken");
                    localStorage.removeItem("adminRefreshToken");
                    window.location.href = "/admin/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
