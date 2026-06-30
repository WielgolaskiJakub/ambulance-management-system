export type ShiftType = "DAY_12H" | "NIGHT_12H" | "FULL_24H" | "OTHER";

export type ShiftStatus = "ACTIVE" | "FINISHED" | "CANCELLED";

export type ShiftCreateRequest = {
  ambulanceId: number;
  shiftType: ShiftType;
  shiftDate: string | null;
  startTime: string;
  endTime: string;
};

export type ShiftResponse = {
  id: number;
  driverId: number;
  ambulanceId: number;
  shiftType: ShiftType;
  createdById: number;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  createdAt: string;
};