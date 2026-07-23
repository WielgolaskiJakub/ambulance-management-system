package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrderStatus;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;

public record RouteTransportOrderReferenceResponse(
        Long id,
        String orderNumber,
        TransportSource source,
        TransportStatus transportOrderStatus,
        RouteOrderStatus routeOrderStatus,
        String pickupAddress,
        String destinationAddress
) {
    public static RouteTransportOrderReferenceResponse fromEntity(
            RouteOrder routeOrder
    ){
        TransportOrder transportOrder = routeOrder.getTransportOrder();
        return new RouteTransportOrderReferenceResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getSource(),
                transportOrder.getStatus(),
                routeOrder.getStatus(),
                transportOrder.getPickupAddress(),
                transportOrder.getDestinationAddress()
        );
    }
}
