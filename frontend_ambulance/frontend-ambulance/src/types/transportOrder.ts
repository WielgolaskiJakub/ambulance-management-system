export type TransportOrderResponse = {
  id: number;
  orderNumber: string | null;
  orderType: string;
  source: string;
  createdById: number;
  createdByFullName: string;
  createdByRole: string;
  status: string;
  pickupAddress: string | null;
  destinationAddress: string | null;
  priority: string;
  description: string | null;
  createdAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledById: number | null;
  cancelReason: string | null;
  cancelDescription: string | null;
  anonymizedAt: string | null;
};

export type TransportOrderPatientDataResponse = {
  id: number;
  transportOrderId: number;
  patientFirstName: string | null;
  patientLastName: string | null;
  pickupDetails: string | null;
  anonymized: boolean;
  anonymizedAt: string | null;
};

export type TransportOrderCrewPreviewResponse = {
  id: number;
  orderNumber: string | null;
  orderType: string;
  source: string;
  priority: string;
  status: string;

  pickupAddress: string | null;
  destinationAddress: string | null;
  description: string | null;

  createdAt: string | null;

  createdById: number;
  createdByFullName: string;
  createdByRole: string;

  patients: TransportOrderPatientDataResponse[];
};

export type TransportOrderPatientCreateItemRequest = {

  patientFirstName: string;
  patientLastName: string;
  pickupDetails: string | null;
};

export type CreateTransportOrderByUserRequest = {
  orderType: string;
  source: string;
  priority: string;
  pickupAddress: string;
  destinationAddress: string;
  description: string | null;
  patients: TransportOrderPatientCreateItemRequest[];
};

export type TransportOrderRouteMemberResponse = {
  id: number;
  userId: number | null;
  memberName: string | null;
  memberRole: string;
  memberSource: string;
};

export type TransportOrderRouteSummaryResponse = {
  id: number;
  shiftId: number;
  startAddress: string | null;
  actualDestinationAddress: string | null;
  distanceKm: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
  status: string;
  routeMembers: TransportOrderRouteMemberResponse[];
};

export type TransportOrderDetailsResponse = {
  id: number;
  orderNumber: string | null;
  orderType: string;
  source: string;
  priority: string;
  status: string;
  pickupAddress: string | null;
  destinationAddress: string | null;
  description: string | null;
  createdAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  patients: TransportOrderPatientDataResponse[];
  routes: TransportOrderRouteSummaryResponse[];
};