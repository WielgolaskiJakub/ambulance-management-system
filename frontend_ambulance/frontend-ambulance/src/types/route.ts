export type RouteStatus = 
  | "CREATED"
  | "IN_PROGRESS"
  | "WAITING"
  | "COMPLETED"

export type RouteTransportOrderReference = {
  id: number;
  orderNumber: string;
  source: string;
  status: string;
  pickupAddress: string | null;
  destinationAddress: string | null;
};

export type RouteResponse = {
  id: number;
  transportOrders: RouteTransportOrderReference[];
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