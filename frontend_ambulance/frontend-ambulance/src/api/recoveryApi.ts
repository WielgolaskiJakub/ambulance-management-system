import { axiosClient } from "./axiosClient";
import type { 
    FinishRouteAfterOutageRequest,
     RouteResponse,
     RecoveryRouteSummaryResponse
    } from "../types/route";

export async function finishRouteAfterOutage(
    routeId:number,
    request: FinishRouteAfterOutageRequest
): Promise<void>{
    await axiosClient.post<void>(
        `/api/v1/recovery/routes/${routeId}/finish`,
        request
    );
}

export async function getRouteForRecovery(routeId: number): Promise<RouteResponse> {
  const response = await axiosClient.get<RouteResponse>(
    `/api/v1/recovery/routes/${routeId}`
  );

  return response.data;
}

export async function getRoutesForRecovery(): Promise<RecoveryRouteSummaryResponse[]> {
  const response = await axiosClient.get<RecoveryRouteSummaryResponse[]>(
    "/api/v1/recovery/routes"
  );

  return response.data;
}

export async function getRecoveryAccess(): Promise<boolean> {
  const response = await axiosClient.get<boolean>("/api/v1/recovery/access");
  return response.data;
}