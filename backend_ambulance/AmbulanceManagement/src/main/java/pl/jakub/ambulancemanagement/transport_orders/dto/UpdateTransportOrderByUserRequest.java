package pl.jakub.ambulancemanagement.transport_orders.dto;

import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;

@Getter
@Setter
public class UpdateTransportOrderByUserRequest {

    private TransportOrderType orderType;

    private TransportSource source;

    private TransportPriority priority;

    private String description;

}
