export type RouteStatus = 
  | "CREATED"
  | "IN_PROGRESS"
  | "WAITING"
  | "COMPLETED"

export type RouteTransportOrderReference = {
  id: number;
  orderNumber: string;
  source: string;
  transportOrderStatus: string;
  routeOrderStatus: "PENDING" | "COMPLETED" | "CANCELLED";
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
  startOdometerKm: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
  status: string;
  fuelConsumptionNormUsed: number | null;
  estimatedFuelConsumedLiters: number | null;
};

export type RecoveryOrderResultRequest = 
  | {
    transportOrderId: number;
    action: "COMPLETE" | "WAITING_FOR_PICKUP";
  }
  | {
    transportOrderId: number;
    action: "CANCEL";
    cancelReason: string;
    cancelDescription?: string;
  };

  export type FinishRouteAfterOutageRequest = {
    finishedAt: string;
    finishOdometerKm: number;
    orderResults: RecoveryOrderResultRequest[];
  };

  export type RecoveryRouteSummaryResponse = {
    routeId: number;
    registrationPlates: string;
    driverFullName: string;
    startedAt: string;
  };
