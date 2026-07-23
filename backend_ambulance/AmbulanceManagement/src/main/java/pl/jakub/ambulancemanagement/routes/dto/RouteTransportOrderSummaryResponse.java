package pl.jakub.ambulancemanagement.routes.dto;

import pl.jakub.ambulancemanagement.route_orders.model.RouteOrder;
import pl.jakub.ambulancemanagement.route_orders.model.RouteOrderStatus;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataResponse;
import pl.jakub.ambulancemanagement.transport_orders.model.*;

import java.util.List;

public record RouteTransportOrderSummaryResponse(
        Long id,
        String orderNumber,
        TransportOrderType type,
        TransportSource source,
        TransportPriority priority,
        TransportStatus transportOrderStatus,
        RouteOrderStatus routeOrderStatus,
        String pickupAddress,
        String destinationAddress,
        String description,
        List<TransportOrderPatientDataResponse> patients
) {
    public static RouteTransportOrderSummaryResponse fromEntity(
            RouteOrder routeOrder,
            List<TransportOrderPatientDataResponse> patients) {

        TransportOrder order = routeOrder.getTransportOrder();
        return new RouteTransportOrderSummaryResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderType(),
                order.getSource(),
                order.getPriority(),
                order.getStatus(),
                routeOrder.getStatus(),
                order.getPickupAddress(),
                order.getDestinationAddress(),
                order.getDescription(),
                patients
        );
    }
}
