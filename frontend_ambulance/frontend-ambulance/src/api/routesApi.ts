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