package pl.jakub.ambulancemanagement.transport_orders.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataUpdateRequest;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrderType;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportPriority;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportSource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class UpdateTransportOrderByManagerRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate plannedDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime plannedDepartureTime;

    private TransportOrderType orderType;

    private TransportSource source;

    private TransportPriority priority;

    private String description;

    private String pickupAddress;

    private String destinationAddress;

    private List<TransportOrderPatientDataUpdateRequest> patients;
}
