import { axiosClient } from "./axiosClient";
import type {
    RouteMemberResponse,
    RouteMemberRole,
    RouteMemberSource,
} from "../types/routeMember";
import type { CrewMemberOptionResponse } from "./crewMemberApi";

export type SystemRouteMemberSource = "SUPPORT_SHIFT_TEAM";

export type ExternalRouteMemberSource = Exclude<
    RouteMemberSource,
    "SHIFT_TEAM" | "SUPPORT_SHIFT_TEAM"
>;

export type RouteMemberCreateRequest =
    | {
          userId: number;
          memberName?: never;
          memberRole: RouteMemberRole;
          memberSource: SystemRouteMemberSource;
      }
    | {
          userId?: never;
          memberName: string;
          memberRole: RouteMemberRole;
          memberSource: ExternalRouteMemberSource;
      };

export async function addRouteMemberToRoute(
    routeId: number,
    request: RouteMemberCreateRequest
): Promise<RouteMemberResponse> {
    const response = await axiosClient.post<RouteMemberResponse>(
        `/api/v1/routes/${routeId}/members`,
        request
    );

    return response.data;
}

export async function getRouteMembersByRoute(
    routeId: number
): Promise<RouteMemberResponse[]> {
    const response = await axiosClient.get<RouteMemberResponse[]>(
        `/api/v1/routes/${routeId}/members`
    );

    return response.data;
}

export async function deleteRouteMemberFromRoute(
    routeId: number,
    memberId: number
):Promise<void>{
    await axiosClient.delete(`/api/v1/routes/${routeId}/members/${memberId}`);
}

export async function getRouteMemberCandidates(
  routeId: number
): Promise<CrewMemberOptionResponse[]> {
  const response = await axiosClient.get<CrewMemberOptionResponse[]>(
    `/api/v1/routes/${routeId}/members/candidates`
  );

  return response.data;
}