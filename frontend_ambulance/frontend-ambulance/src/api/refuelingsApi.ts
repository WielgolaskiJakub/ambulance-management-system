import { axiosClient } from "./axiosClient";
import type {
  RefuelingCreateRequest,
  RefuelingResponse,
} from "../types/refueling";

export async function getMyRefuelings(): Promise<RefuelingResponse[]> {
  const response = await axiosClient.get<RefuelingResponse[]>(
    "/api/v1/refuelings/me"
  );

  return response.data;
}

export async function createRefueling(
  request: RefuelingCreateRequest
): Promise<RefuelingResponse> {
  const response = await axiosClient.post<RefuelingResponse>(
    "/api/v1/refuelings",
    request
  );

  return response.data;
}
