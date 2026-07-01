package pl.jakub.ambulancemanagement.transport_orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;

import java.util.List;

@Getter
@Setter
public class CreateTransportOrderByUserRequest {

    @NotNull
    private TransportOrderType orderType;

    @NotNull
    private TransportSource source;

    @NotNull
    private TransportPriority priority;

    @NotBlank
    @Size(max = 1000)
    private String pickupAddress;

    @NotBlank
    @Size(max = 1000)
    private String destinationAddress;

    @Size(max=1000)
    private String description;

    private List<@Valid TransportOrderPatientCreateItemRequest> patients;

}
