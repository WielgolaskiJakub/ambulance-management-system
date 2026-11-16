export type ShiftType = "DAY_12H" | "NIGHT_12H" | "FULL_24H" | "OTHER";

export type ShiftStatus = "ACTIVE" | "FINISHED" | "CANCELLED";

export type ShiftDefaultMemberCreateRequest = {
  userId: number;
  startTime: string;
  endTime: string | null;
};

export type ShiftCreateRequest = {
  ambulanceId: number;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  defaultMember: ShiftDefaultMemberCreateRequest | null;
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