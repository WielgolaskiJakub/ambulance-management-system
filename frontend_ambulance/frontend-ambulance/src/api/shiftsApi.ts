import { axiosClient } from "./axiosClient";
import type { ShiftCreateRequest, ShiftResponse } from "../types/shift";

export async function createShift(
  request: ShiftCreateRequest
): Promise<ShiftResponse> {
  const response = await axiosClient.post<ShiftResponse>(
    "/api/v1/shifts",
    request
  );

  return response.data;
}

export async function finishShift(shiftId: number): Promise<ShiftResponse> {
  const response = await axiosClient.patch<ShiftResponse>(
    `/api/v1/shifts/${shiftId}/finish`
  );

  return response.data;
}