import type { RouteMemberRole } from "./routeMember"

export type ShiftDefaultMemberResponse = {
    id: number,
    userId: number,
    shiftId: number,
    firstName: string,
    lastName: string,
    role: RouteMemberRole,
    startTime: string,
    endTime: string| null
}
