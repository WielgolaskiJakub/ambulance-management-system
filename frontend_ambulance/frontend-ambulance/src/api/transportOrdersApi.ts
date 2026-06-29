import { axiosClient } from "./axiosClient";
import type { TransportOrderResponse } from "../types/transportOrder";

export async function getNewTransportOrdersForCrew(): Promise<TransportOrderResponse[]> {
    const response = await axiosClient.get<TransportOrderResponse[]>(
        "/api/v1/transport-orders/queue/new"
    );
    return response.data;
}