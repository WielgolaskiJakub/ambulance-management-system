package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;

public record RouteTransportOrderReferenceResponse(
        Long id,
        String orderNumber,
        TransportSource source
) {
    public static RouteTransportOrderReferenceResponse fromEntity(
            TransportOrder transportOrder
    ){
        return new RouteTransportOrderReferenceResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getSource()
        );
    }
}
