package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.routes.model.RouteOrderFinishAction;

@Getter
@Setter
public class RouteFinishOrderItemRequest {

    @NotNull
    private Long transportOrderId;

    @NotNull
    private RouteOrderFinishAction action;
}
