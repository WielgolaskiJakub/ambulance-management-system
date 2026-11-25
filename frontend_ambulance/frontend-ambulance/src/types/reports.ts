import type { RouteStatus } from "./route";
import type { RouteTransportOrderReference } from "./route";
import type { RouteMemberResponse } from "./routeMember";

export type AmbulanceReportResponse = {
    ambulanceId: number;
    registrationPlates: string;
    dateFrom: string;
    dateTo: string;
    firstStartOdometerKm: number | null;
    lastFinishOdometerKm: number | null;
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

export type RouteReportResponse = {
    routeId: number;
    registrationPlates: string;
    driverFullName: string;
    startedAt: string;
    finishedAt: string | null;
    status: RouteStatus;
    startOdometerKm: number | null;
    finishOdometerKm: number | null;
    distanceKm: number | null;
    estimatedFuelConsumedLiters: number | null;
    transportOrders: RouteTransportOrderReference[];
    routeMembers: RouteMemberResponse[];
};

export type DailyReportResponse = {
    date: string;
    routes: RouteReportResponse[];
    totalRoutesCount: number;
    completedRoutesCount: number;
    unsettledRoutesCount: number;
    totalDistanceKm: number;
    totalEstimatedFuelConsumptionLiters: number;
};

export type DriverReportRequest = {
    driverId: number;
    dateFrom: string;
    dateTo: string;
};

export type DriverReportResponse = {
    driverId: number;
    driverFullName: string;
    dateFrom: string;
    dateTo: string;
    routes: RouteReportResponse[];
    totalRoutesCount: number;
    completedRoutesCount: number;
    unsettledRoutesCount: number;
    totalDistanceKm: number;
    totalEstimatedFuelConsumptionLiters: number;
};
