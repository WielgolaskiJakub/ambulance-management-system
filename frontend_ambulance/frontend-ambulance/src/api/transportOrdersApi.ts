import { axiosClient } from "./axiosClient";
import type { 
    TransportOrderResponse,
    TransportOrderCrewPreviewResponse
 } from "../types/transportOrder";

export async function getNewTransportOrdersForCrew(): Promise<TransportOrderResponse[]> {
    const response = await axiosClient.get<TransportOrderResponse[]>(
        "/api/v1/transport-orders/queue/new"
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