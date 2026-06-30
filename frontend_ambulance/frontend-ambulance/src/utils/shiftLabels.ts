import type { ShiftType, ShiftStatus } from "../types/shift";

export const shiftTypeLabels: Record<ShiftType, string> = {
  DAY_12H: "Dzienna 12h",
  NIGHT_12H: "Nocna 12h",
  FULL_24H: "Całodobowa 24h",
  OTHER: "Inna",
};

export const shiftStatusLabels: Record<ShiftStatus, string> = {
  ACTIVE: "Aktywna",
  FINISHED: "Zakończona",
  CANCELLED: "Anulowana",
};

export function getShiftTypeLabel(shiftType: ShiftType): string {
  return shiftTypeLabels[shiftType] ?? shiftType;
}

export function getShiftStatusLabel(status: ShiftStatus): string {
  return shiftStatusLabels[status] ?? status;
}