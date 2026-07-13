import type { RouteMemberRole } from "./routeMember";

export type ManagerAmbulanceCrewMember = {
  fullName: string,
  role: RouteMemberRole
};

export type ManagerAmbulanceCurrentTransportOrder = {
  id: number,
  orderNumber: string | null
};

export type AmbulanceDashboardResponse = {
  shiftId: number;
  shiftStatus: string;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  shiftTimeLabel: string | null;

  currentDate: string;

  loggedUserId: number;
  loggedUserFullName: string;
  loggedUserRole: string;

  ambulanceId: number;
  registrationPlates: string;
  carBrand: string;
  model: string;

  mileage: number;

  estimatedFuelLiters: number | null;
  estimatedFuelLitersDisplay: number | null;
  tankCapacityLiters: number | null;
  fuelEstimateUpdatedAt: string | null;
};

export type ManagerAmbulanceDashboardResponse = {
  shiftId: number;
  ambulanceId: number;
  registrationPlates: string;
  carBrand: string;
  model: string;
  driverFullName: string;
  crewMembers: ManagerAmbulanceCrewMember[];
  currentTransportOrders:ManagerAmbulanceCurrentTransportOrder[];
  routeAcceptedAt: string | null;
  currentRouteStatus: "WAITING" | "IN_PROGRESS" | "CREATED" |null;
  routeStartedAt: string | null;
  routeStartAddress: string | null;
  routeDestinationAddress: string | null;
};