import { axiosClient } from "./axiosClient";
import type { RouteMemberRole } from "../types/routeMember";
import type { ShiftDefaultMemberResponse } from "../types/shiftDefaultMember";

export type CreateShiftDefaultMemberRequest = {
    userId: number;
    shiftId: number;
    role: RouteMemberRole;
    startTime: string;
    endTime: string | null;
};

export async function createShiftDefaultMember(
    request: CreateShiftDefaultMemberRequest
): Promise<ShiftDefaultMemberResponse> {
    const response = await axiosClient.post<ShiftDefaultMemberResponse>(
        "/api/v1/shift-default-members",
        request
    );

    return response.data;
}

export async function finishShiftDefaultMember(
    id: number
): Promise<ShiftDefaultMemberResponse> {
    const response = await axiosClient.patch<ShiftDefaultMemberResponse>(
        `/api/v1/shift-default-members/${id}/finish`
    );

    return response.data;
}

export async function extendShiftDefaultMemberOpenEnded(
    id: number
): Promise<ShiftDefaultMemberResponse> {
    const response = await axiosClient.patch<ShiftDefaultMemberResponse>(
        `/api/v1/shift-default-members/${id}/extend-open-ended`
    );

    return response.data;
}

export async function getShiftDefaultMembersByShiftId(
    shiftId: number
): Promise<ShiftDefaultMemberResponse[]> {
    const response = await axiosClient.get<ShiftDefaultMemberResponse[]>(
        `/api/v1/shift-default-members/shift/${shiftId}`
    );

    return response.data;
}