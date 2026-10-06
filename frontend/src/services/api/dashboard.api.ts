import apiClient from "./client";

import type {
    DashboardOverview,
} from "@/types/dashboard";


/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

interface DashboardResponse {
    success: boolean;
    message: string;
    data: DashboardOverview;
}


/*
|--------------------------------------------------------------------------
| Dashboard API
|--------------------------------------------------------------------------
*/

export async function getDashboardOverview(): Promise<DashboardOverview> {
    const response =
        await apiClient.get<DashboardResponse>(
            "/dashboard/overview",
        );

    return response.data.data;
}
