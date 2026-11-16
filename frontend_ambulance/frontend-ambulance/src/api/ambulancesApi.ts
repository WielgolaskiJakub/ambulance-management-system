import { axiosClient } from "./axiosClient";
import type {
    AmbulanceShortResponse,
    AmbulanceResponse,
} from "../types/ambulance";


export type CreateAmbulanceRequest = {
    carBrand: string;
    model: string;
    registrationPlates: string;
    mileage: number;
    summerFuelConsumptionNorm: number;
    winterFuelConsumptionNorm: number;
    tankCapacityLiters: number;
};

export type UpdateAmbulanceRequest = {
    carBrand?: string;
    model?: string;
    registrationPlates?: string;
    mileage?: number;
    summerFuelConsumptionNorm?: number;
    winterFuelConsumptionNorm?: number;
    tankCapacityLiters?: number;
};

export async function getAvailableAmbulances(): Promise<AmbulanceShortResponse[]> {
    const response = await axiosClient.get<AmbulanceShortResponse[]>(
        "/api/v1/ambulances/available"
    );

    return response.data;
}

export async function getAllAmbulances(): Promise<AmbulanceResponse[]> {
    const response = await axiosClient.get<AmbulanceResponse[]>(
        "/api/v1/ambulances"
    );

    return response.data;
}

export async function getAmbulanceById(
    id: number
): Promise<AmbulanceResponse> {
    const response = await axiosClient.get<AmbulanceResponse>(
        `/api/v1/ambulances/${id}`
    );
    return response.data;
}

export async function createAmbulance(
    request: CreateAmbulanceRequest
): Promise<AmbulanceResponse> {
    const response = await axiosClient.post<AmbulanceResponse>(
        "/api/v1/ambulances",
        request
    );
    return response.data;
}

export async function updateAmbulance(
    id: number,
    request: UpdateAmbulanceRequest
): Promise<AmbulanceResponse> {
    const response = await axiosClient.patch<AmbulanceResponse>(
        `/api/v1/ambulances/${id}`,
        request
    );
    return response.data;
}

export async function markAmbulanceOutOfService(
    id: number
): Promise<AmbulanceResponse> {
    const response = await axiosClient.patch<AmbulanceResponse>(
        `/api/v1/ambulances/${id}/out-of-service`
    );

    return response.data;
}

export async function markAmbulanceAvailable(
    id: number
): Promise<AmbulanceResponse> {
    const response = await axiosClient.patch<AmbulanceResponse>(
        `/api/v1/ambulances/${id}/available`
    );

    return response.data;
}

export async function deactivateAmbulanceById(
    id: number
): Promise<void> {
    await axiosClient.delete<void>(`/api/v1/ambulances/${id}`);
}

export async function restoreAmbulanceById(
    id: number
): Promise<AmbulanceResponse> {
    const response = await axiosClient.patch<AmbulanceResponse>(
        `/api/v1/ambulances/${id}/restore`
    );

    return response.data;
}