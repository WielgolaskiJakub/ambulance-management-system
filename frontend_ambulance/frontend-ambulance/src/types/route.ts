export type RouteResponse = {
    id: number;
    shiftId: number;
    startAddress: string;
    actualDestinationAddress: string;
    distanceKM: number | null;
    startedAt: string | null;
    finishedAt: string | null;
    notes: string | null;
    status: string;
    startOdometerKm: number | null;
    finishOdometerKm: number | null;
    fuelConsumptionNormUsed: number | null;
    estimatedFuelConsumedLiters: number | null;
};