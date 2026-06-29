export type RouteResponse = {
  id: number;
  transportOrderIds: number[];
  shiftId: number;
  startAddress: string;
  actualDestinationAddress: string;
  distanceKm: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
  status: string;
  fuelConsumptionNormUsed: number | null;
  estimatedFuelConsumedLiters: number | null;
};