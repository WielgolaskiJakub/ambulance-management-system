import { axiosClient } from "./axiosClient";
import type { AmbulanceDashboardResponse } from "../types/dashboard";

export async function getMyDashboard(): Promise<AmbulanceDashboardResponse> {
    const response = await axiosClient.get<AmbulanceDashboardResponse>(
        "/api/v1/dashboards/me"
    );
    return response.data;
}