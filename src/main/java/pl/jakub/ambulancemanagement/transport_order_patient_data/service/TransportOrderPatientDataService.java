package pl.jakub.ambulancemanagement.transport_order_patient_data.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataCreateRequest;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataUpdateRequest;
import pl.jakub.ambulancemanagement.transport_order_patient_data.repository.TransportOrderPatientDataRepository;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransportOrderPatientDataService {

    private final TransportOrderPatientDataRepository transportOrderPatientDataRepository;
    private final TransportOrderRepository transportOrderRepository;


    public List<TransportOrderPatientData> getPatientsByTransportOrderId(Long transportOrderId) {

        transportOrderRepository.findById(transportOrderId)
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

        return transportOrderPatientDataRepository.findByTransportOrderId(transportOrderId);
    }

    public TransportOrderPatientData getTransportOrderPatientDataById(long id) {
        return transportOrderPatientDataRepository.findById(id).
                orElseThrow(() -> new ApiException(ErrorCode.PATIENT_NOT_FOUND));
    }

    public TransportOrderPatientData createTransportOrderPatientData(
            TransportOrderPatientDataCreateRequest request) {

        TransportOrder transportOrder = transportOrderRepository.
                findById(request.getTransportOrderId()).orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

        validateTransportOrderCanReceivePatientData(transportOrder);

        TransportOrderPatientData patientData = new TransportOrderPatientData();

        patientData.setTransportOrder(transportOrder);
        patientData.setPatientFirstName(request.getPatientFirstName().trim());
        patientData.setPatientLastName(request.getPatientLastName().trim());
        patientData.setPickupDetails(normalizeNullableText(request.getPickupDetails()));


        return transportOrderPatientDataRepository.save(patientData);
    }

    public TransportOrderPatientData updateTransportOrderPatientData(
            TransportOrderPatientDataUpdateRequest request, long id) {

        TransportOrderPatientData patientDataToUpdate = getTransportOrderPatientDataById(id);

        validateTransportOrderCanReceivePatientData(patientDataToUpdate.getTransportOrder());

        if (request.getTransportOrderId() != null) {

            TransportOrder transportOrder = transportOrderRepository.
                    findById(request.getTransportOrderId())
                    .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

            validateTransportOrderCanReceivePatientData(transportOrder);

            patientDataToUpdate.setTransportOrder(transportOrder);
        }

        if (request.getPatientFirstName() != null) {
            if (request.getPatientFirstName().isBlank()) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
            }
            patientDataToUpdate.setPatientFirstName(request.getPatientFirstName().trim());
        }

        if (request.getPatientLastName() != null) {
            if (request.getPatientLastName().isBlank()) {
                throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
            }
            patientDataToUpdate.setPatientLastName(request.getPatientLastName().trim());
        }

        if (request.getPickupDetails() != null) {
            patientDataToUpdate.setPickupDetails(normalizeNullableText(request.getPickupDetails()));
        }
        return transportOrderPatientDataRepository.save(patientDataToUpdate);
    }

    public void deleteTransportOrderPatientData(long id) {
        TransportOrderPatientData patientData = getTransportOrderPatientDataById(id);

        validateTransportOrderCanReceivePatientData(patientData.getTransportOrder());

        transportOrderPatientDataRepository.delete(patientData);
    }

//TODO AUTOANONIMIZACJA Scheduler

    public TransportOrderPatientData anonymizeTransportOrderPatientData(long id) {
        TransportOrderPatientData patientData = getTransportOrderPatientDataById(id);

        patientData.setPatientFirstName(null);
        patientData.setPatientLastName(null);
        patientData.setPickupDetails(null);
        patientData.setAnonymizedAt(LocalDateTime.now());

        return transportOrderPatientDataRepository.save(patientData);
    }

    public List<TransportOrderPatientData> anonymizePatientsByTransportOrderId(Long transportOrderId) {
        TransportOrder transportOrder = transportOrderRepository.findById(transportOrderId)
                .orElseThrow(() -> new ApiException(ErrorCode.TRANSPORT_ORDER_NOT_FOUND));

        List<TransportOrderPatientData> patients =
                transportOrderPatientDataRepository.findByTransportOrderId(transportOrder.getId());

        for (TransportOrderPatientData patientData : patients) {
            patientData.setPatientFirstName(null);
            patientData.setPatientLastName(null);
            patientData.setPickupDetails(null);
            patientData.setAnonymizedAt(LocalDateTime.now());
        }

        return transportOrderPatientDataRepository.saveAll(patients);
    }

    private void validateTransportOrderCanReceivePatientData(TransportOrder transportOrder) {
        if (transportOrder.getStatus() == TransportStatus.CANCELLED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_CANCELLED);
        }

        if (transportOrder.getStatus() == TransportStatus.COMPLETED) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_ALREADY_COMPLETED);
        }
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

}
