export type RefuelingStatus = "REPORTED" | "VERIFIED";

export type RefuelingResponse = {
  id: number;
  ambulanceId: number;
  driverId: number;
  shiftId: number;
  refuelingAt: string | null;
  liters: number;
  mileageAtRefueling: number;
  status: RefuelingStatus | string;
  invoiceNumber: string | null;
  totalCost: number | null;
  verifiedById: number | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string | null;
};

export type RefuelingCreateRequest = {
  ambulanceId: number;
  shiftId: number;
  liters: number;
  mileageAtRefueling: number;
  notes: string | null;
};
