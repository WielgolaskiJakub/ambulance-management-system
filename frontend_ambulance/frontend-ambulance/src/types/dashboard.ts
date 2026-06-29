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