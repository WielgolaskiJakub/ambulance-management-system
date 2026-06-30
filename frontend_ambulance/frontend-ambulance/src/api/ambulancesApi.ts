import { axiosClient } from "./axiosClient";
import type { AmbulanceShortResponse } from "../types/ambulance";


export async function getAvailableAmbulances(): Promise<AmbulanceShortResponse[]>{
    const response = await axiosClient.get<AmbulanceShortResponse[]>(
        "/api/v1/ambulances/available"
    );

    return response.data;
}
