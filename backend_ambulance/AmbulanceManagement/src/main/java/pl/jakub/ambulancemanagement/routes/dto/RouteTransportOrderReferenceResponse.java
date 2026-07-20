package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;

public record RouteTransportOrderReferenceResponse(
        Long id,
        String orderNumber
) {
    public static RouteTransportOrderReferenceResponse fromEntity(
            TransportOrder transportOrder
    ){
        return new RouteTransportOrderReferenceResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber()
        );
    }
}
