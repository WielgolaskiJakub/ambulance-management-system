import { axiosClient } from "./axiosClient";

export type CrewMemberOptionResponse = {
    id: number;
    firstName: string;
    lastName: string;
    userRole: string;
};

export async function getAvailableSanitaryMembers(): Promise<CrewMemberOptionResponse[]> {
    const response = await axiosClient.get<CrewMemberOptionResponse[]>(
        "/api/v1/users/available-sanitary-members"
    );

    return response.data;
}