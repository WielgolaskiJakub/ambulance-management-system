package pl.jakub.ambulancemanagement.transport_order_patient_data.service;


import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataPatchRequest;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.repository.TransportOrderPatientDataRepository;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.service.TransportOrderService;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
public class TransportOrderPatientDataServiceTest {

    @Mock
    private TransportOrderPatientDataRepository transportOrderPatientDataRepository;

    @Mock
    private TransportOrderService transportOrderService;

    @InjectMocks
    private TransportOrderPatientDataService transportOrderPatientDataService;


    @Test
    void shouldUpdatePatientDataWithoutChangingTransportOrder(){

        long patientId = 10L;
        long transportOrderId = 20L;

        TransportOrder transportOrder = new TransportOrder();
        transportOrder.setId(transportOrderId);
        transportOrder.setStatus(TransportStatus.NEW);

        TransportOrderPatientData patient = new TransportOrderPatientData();
        patient.setId(patientId);
        patient.setTransportOrder(transportOrder);
        patient.setPatientFirstName("John");
        patient.setPatientLastName("Doe");
        patient.setPickupDetails("Oddział Chirurgii");

        TransportOrderPatientDataPatchRequest request = new TransportOrderPatientDataPatchRequest();
        request.setPatientFirstName("Artur");
        request.setPickupDetails("Oddział Ortopedii");

        when(transportOrderPatientDataRepository.findById(patientId))
                .thenReturn(Optional.of(patient));

        when(transportOrderService.getTransportOrderByIdWithAccessCheck(transportOrderId))
                .thenReturn(transportOrder);

        when(transportOrderPatientDataRepository.save(any(TransportOrderPatientData.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));


        TransportOrderPatientData result =
                transportOrderPatientDataService.updateTransportOrderPatientData(
                        request, patientId
                );


        assertEquals("Artur", result.getPatientFirstName());
        assertEquals("Doe", result.getPatientLastName());
        assertEquals("Oddział Ortopedii", result.getPickupDetails());

        assertSame(transportOrder, result.getTransportOrder());

        verify(transportOrderPatientDataRepository).save(patient);
        verify(transportOrderService).getTransportOrderByIdWithAccessCheck(transportOrderId);

    }
}
