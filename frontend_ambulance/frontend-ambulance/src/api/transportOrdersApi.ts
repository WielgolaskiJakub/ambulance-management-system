import { axiosClient } from "./axiosClient";
import type {
    TransportOrderResponse,
    TransportOrderCrewPreviewResponse,
    CreateTransportOrderByUserRequest,
    TransportOrderDetailsResponse,
} from "../types/transportOrder";

export async function getAvailableTransportOrdersForCrew(): Promise<TransportOrderResponse[]> {
    const response = await axiosClient.get<TransportOrderResponse[]>(
        "/api/v1/transport-orders/queue/available"
    );
    return response.data;
}

export async function getTransportOrderCrewPreview(
    orderId: number
): Promise<TransportOrderCrewPreviewResponse> {
    const response = await axiosClient.get<TransportOrderCrewPreviewResponse>(
        `/api/v1/transport-orders/${orderId}/crew-preview`
    );
    return response.data;
}

export async function createTransportOrderByUser(
    request: CreateTransportOrderByUserRequest
): Promise<TransportOrderResponse> {
    const response = await axiosClient.post<TransportOrderResponse>(
        `/api/v1/transport-orders/user`,
        request
    );
    return response.data;
}

export async function getMyTransportOrders(): Promise<TransportOrderResponse[]>{
    const response = await axiosClient.get<TransportOrderResponse[]>(
        `/api/v1/transport-orders/me`
    );
    return response.data;
}

export async function getTransportOrderDetails(
    orderId:number
): Promise <TransportOrderDetailsResponse>{
    const response = await axiosClient.get<TransportOrderDetailsResponse>(
        `/api/v1/transport-orders/${orderId}/details`
    );
    return response.data;
}