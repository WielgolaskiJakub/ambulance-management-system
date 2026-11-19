package pl.jakub.ambulancemanagement.recovery.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportCancelReason;

public record RecoveryOrderResultRequest(

        @NotNull
        @Positive
        Long transportOrderId,

        @NotNull
        RecoveryOrderAction action,

        TransportCancelReason cancelReason,

        String cancelDescription
) {
}
