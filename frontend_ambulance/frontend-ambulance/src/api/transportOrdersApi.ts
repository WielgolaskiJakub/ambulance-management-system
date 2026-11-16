import { axiosClient } from "./axiosClient";
import type {
    TransportOrderResponse,
    TransportOrderCrewPreviewResponse,
    CreateTransportOrderByUserRequest,
    TransportOrderDetailsResponse,
    CreateTransportOrderByManagerRequest,
    UpdateTransportOrderByManagerRequest,
    CancelTransportOrderRequest
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

export async function getMyTransportOrders(): Promise<TransportOrderResponse[]> {
    const response = await axiosClient.get<TransportOrderResponse[]>(
        `/api/v1/transport-orders/me`
    );
    return response.data;
}

export async function getTransportOrderDetails(
    orderId: number
): Promise<TransportOrderDetailsResponse> {
    const response = await axiosClient.get<TransportOrderDetailsResponse>(
        `/api/v1/transport-orders/${orderId}/details`
    );
    return response.data;
}

export async function createTransportOrderByManager(
    request: CreateTransportOrderByManagerRequest): Promise<TransportOrderResponse> {
    const response = await axiosClient.post<TransportOrderResponse>(
        `/api/v1/transport-orders/manager`,
        request
    );
    return response.data;
}

export type TransportOrderStatus = "NEW" | "WAITING_FOR_PICKUP" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export async function getTransportOrdersQueue(
    statuses: TransportOrderStatus[]
): Promise<TransportOrderResponse[]> {

    const params = new URLSearchParams();
    statuses.forEach((status) => {
        params.append("status", status);
    });

    const response = await axiosClient.get<TransportOrderResponse[]>(
        `/api/v1/transport-orders/queue?${params.toString()}`
    );
    
    return response.data;
}

export async function getManagerTransportOrdersQueue(): Promise<TransportOrderResponse[]> {
    return getTransportOrdersQueue(["NEW", "WAITING_FOR_PICKUP", "IN_PROGRESS"]);
}

export async function updateTransportOrderByManager(
  orderId: number,
  request: UpdateTransportOrderByManagerRequest
): Promise<TransportOrderResponse> {
  const response = await axiosClient.patch<TransportOrderResponse>(
    `/api/v1/transport-orders/${orderId}/manager`,
    request
  );

  return response.data;
}

export async function cancelTransportOrder(
    orderId: number,
    request: CancelTransportOrderRequest): Promise<TransportOrderResponse> {
        const response = await axiosClient.patch<TransportOrderResponse>(
            `/api/v1/transport-orders/${orderId}/cancel`,
            request
        );
        return response.data;
    }