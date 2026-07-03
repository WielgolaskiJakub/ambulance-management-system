package pl.jakub.ambulancemanagement.transport_orders.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class CreateTransportOrderByManagerRequest {

     @NotNull
     @JsonFormat(pattern = "yyyy-MM-dd")
     private LocalDate plannedDate;

     @JsonFormat(pattern = "HH:mm")
     private LocalTime plannedDepartureTime;

     private String orderNumber;

     @NotNull
     private TransportOrderType orderType;

     @NotNull
     private TransportSource source;

     @NotNull
     private TransportPriority  priority;

     @Size(max=1000)
     private String description;

     @NotBlank
     private String pickupAddress;

     @NotBlank
     private String destinationAddress;


     private List<@Valid TransportOrderPatientCreateItemRequest> patients;
}
