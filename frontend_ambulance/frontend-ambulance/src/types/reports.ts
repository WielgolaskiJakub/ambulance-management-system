import type { RouteStatus } from "./route";
import type { RouteTransportOrderReference } from "./route";

export type AmbulanceReportResponse = {
    ambulanceId: number;
    registrationPlates: string;
    dateFrom: string;
    dateTo: string;
    totalDistanceKm: number;
    completedRoutesCount: number;
    totalEstimatedFuelConsumptionLiters: number;
};

export type AmbulanceReportSummaryResponse = {
    ambulances: AmbulanceReportResponse[];
    allTotalDistanceKm: number;
    allCompletedRoutesCount: number;
    allTotalEstimatedFuelConsumptionLiters: number;
};

export type AmbulanceReportRequest = {
    ambulanceIds: number[];
    dateFrom: string;
    dateTo: string;
};

export type DailyRouteReportResponse = {
    routeId: number;
    registrationPlates: string;
    driverFullName: string;
    startedAt: string;
    finishedAt: string | null;
    status: RouteStatus;
    distanceKm: number | null;
    estimatedFuelConsumedLiters: number | null;
    transportOrders: RouteTransportOrderReference[];
};

export type DailyReportResponse = {
    date: string;
    routes: DailyRouteReportResponse[];
    totalRoutesCount: number;
    completedRoutesCount: number;
    unsettledRoutesCount: number;
    totalDistanceKm: number;
    totalEstimatedFuelConsumptionLiters: number;
};
