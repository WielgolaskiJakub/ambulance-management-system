package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;

public record RouteTransportOrderReferenceResponse(
        Long id,
        String orderNumber,
        TransportSource source,
        TransportStatus status,
        String pickupAddress,
        String destinationAddress
) {
    public static RouteTransportOrderReferenceResponse fromEntity(
            TransportOrder transportOrder
    ){
        return new RouteTransportOrderReferenceResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getSource(),
                transportOrder.getStatus(),
                transportOrder.getPickupAddress(),
                transportOrder.getDestinationAddress()
        );
    }
}
