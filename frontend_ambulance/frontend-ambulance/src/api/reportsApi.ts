import { axiosClient } from "./axiosClient";
import type { AmbulanceReportRequest, AmbulanceReportSummaryResponse } from "../types/reports";

export async function getReport(request: AmbulanceReportRequest): Promise<AmbulanceReportSummaryResponse> {
  const response = await axiosClient.get<AmbulanceReportSummaryResponse>(
    "/api/v1/reports/ambulances",
    {
      params: {
        ambulanceIds: request.ambulanceIds.join(","),
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
      },
    }
  );
  return response.data;
}