package pl.jakub.ambulancemanagement.transport_orders.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;

@Getter
@Setter
public class CreateTransportOrderByUserRequest {

    @NotNull
    private TransportOrderType orderType;

    @NotNull
    private TransportSource source;

    @NotNull
    private TransportPriority priority;

    @Size(max=1000)
    private String description;

    @NotNull
    private Long createdById; //TODO jwt
}
