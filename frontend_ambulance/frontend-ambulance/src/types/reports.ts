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