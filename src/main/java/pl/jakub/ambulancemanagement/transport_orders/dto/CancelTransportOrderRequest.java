package pl.jakub.ambulancemanagement.transport_orders.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportCancelReason;

@Getter
@Setter
public class CancelTransportOrderRequest {

    @NotNull
    private Long cancelledById;

    @NotNull
    private TransportCancelReason  cancelReason;

    private String cancelDescription;
}
