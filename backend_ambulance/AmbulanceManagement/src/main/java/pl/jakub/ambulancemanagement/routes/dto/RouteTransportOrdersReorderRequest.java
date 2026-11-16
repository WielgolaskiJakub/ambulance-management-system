package pl.jakub.ambulancemanagement.routes.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RouteTransportOrdersReorderRequest {

    @NotEmpty
    private List<@NotNull Long> transportOrderIds;
}
