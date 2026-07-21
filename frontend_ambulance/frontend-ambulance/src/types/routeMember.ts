export type RouteMemberRole =
  | "DRIVER"
  | "SANITARY_WORKER"
  | "PARAMEDIC"
  | "NURSE"
  | "DOCTOR"
  | "OTHER";

export type RouteMemberSource =
  | "SHIFT_TEAM"
  | "SUPPORT_SHIFT_TEAM"
  | "HOSPITAL_STAFF"
  | "SOR_STAFF"
  | "NPL"
  | "POZ"
  | "OTHER";

export type RouteMemberResponse = {
  id: number;
  routeId: number;
  originShiftId: number | null;
  userId: number | null;
  memberName: string | null;
  fullName: string;
  role: RouteMemberRole;
  source: RouteMemberSource;
};