import { axiosClient } from "./axiosClient";
import type {
   AmbulanceReportRequest,
   AmbulanceReportSummaryResponse, 
   DailyReportResponse,
   DriverReportRequest,
   DriverReportResponse
  } 
   from "../types/reports";

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

export async function getDailyReport(
  date:string
): Promise<DailyReportResponse>{
  const response = await axiosClient.get<DailyReportResponse>(
    "/api/v1/reports/daily",
    {
      params: {
        date: date,
      },
    }
  );
  return response.data;
}

export async function getDriverReport(
  request: DriverReportRequest
): Promise<DriverReportResponse> {
  const response = await axiosClient.get<DriverReportResponse>(
    "/api/v1/reports/drivers",
    {
      params: {
        driverId: request.driverId,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
      },
    }
  );
  return response.data;
}