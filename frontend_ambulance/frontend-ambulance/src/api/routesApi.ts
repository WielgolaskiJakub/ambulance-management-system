import { axiosClient } from "./axiosClient";
import type { RouteResponse } from "../types/route";

export type CreateRouteFromOrderRequest = {
  shiftId: number;
  notes: string | null;
};

export async function createRouteFromOrder(
  transportOrderId: number,
  request: CreateRouteFromOrderRequest
): Promise<RouteResponse> {
  const response = await axiosClient.post<RouteResponse>(
    `/api/v1/routes/from-order/${transportOrderId}`,
    request
  );

  return response.data;
}

export async function getMyRoutes(): Promise<RouteResponse[]> {
  const response = await axiosClient.get<RouteResponse[]>("/api/v1/routes/me");

  return response.data;
}

export async function startRoute(routeId: number): Promise<RouteResponse> {
  const response = await axiosClient.patch<RouteResponse>(
    `/api/v1/routes/${routeId}/start`
  );

  return response.data;
}