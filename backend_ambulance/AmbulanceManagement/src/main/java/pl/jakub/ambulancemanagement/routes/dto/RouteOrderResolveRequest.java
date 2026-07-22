package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotNull;
import pl.jakub.ambulancemanagement.routes.model.RouteOrderFinishAction;

public record RouteOrderResolveRequest (
        @NotNull(message = "Action is required")
        RouteOrderFinishAction action
){

}
