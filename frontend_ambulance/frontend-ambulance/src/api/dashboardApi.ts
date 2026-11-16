import { axiosClient } from "./axiosClient";
import type { 
    AmbulanceDashboardResponse,
    ManagerAmbulanceDashboardResponse,
} from "../types/dashboard";

export async function getMyDashboard(): Promise<AmbulanceDashboardResponse> {
    const response = await axiosClient.get<AmbulanceDashboardResponse>(
        "/api/v1/dashboards/me"
    );
    return response.data;
}

export async function getDashboardByManager(): 
Promise<ManagerAmbulanceDashboardResponse[]> {
  const response = await axiosClient.get<
    ManagerAmbulanceDashboardResponse[]
  >("/api/v1/dashboards/shifts/view");

  return response.data;
}