package pl.jakub.ambulancemanagement.transport_order_patient_data.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.transport_order_patient_data.model.TransportOrderPatientData;
import pl.jakub.ambulancemanagement.transport_order_patient_data.dto.TransportOrderPatientDataUpdateRequest;
import pl.jakub.ambulancemanagement.transport_order_patient_data.repository.TransportOrderPatientDataRepository;
import pl.jakub.ambulancemanagement.transport_orders.dto.TransportOrderPatientCreateItemRequest;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportOrder;
import pl.jakub.ambulancemanagement.transport_orders.model.TransportStatus;
import pl.jakub.ambulancemanagement.transport_orders.service.TransportOrderService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransportOrderPatientDataService {

    private final TransportOrderPatientDataRepository transportOrderPatientDataRepository;
    private final TransportOrderService transportOrderService;


    @Transactional(readOnly = true)
    public List<TransportOrderPatientData> getPatientsByTransportOrderId(Long transportOrderId) {

        TransportOrder transportOrder = transportOrderService.getTransportOrderByIdWithAccessCheck(transportOrderId);

        return transportOrderPatientDataRepository.findByTransportOrderId(transportOrder.getId());
    }

    @Transactional(readOnly = true)
    public TransportOrderPatientData getTransportOrderPatientDataById(long id) {
        TransportOrderPatientData patientData = transportOrderPatientDataRepository.findById(id).
                orElseThrow(() -> new ApiException(ErrorCode.PATIENT_NOT_FOUND));

        transportOrderService.getTransportOrderByIdWithAccessCheck(patientData.getTransportOrder().getId());

        return patientData;
    }

    @Transactional
    public TransportOrderPatientData updateTransportOrderPatientData(
            TransportOrderPatientDataUpdateRequest request, long id) {

        TransportOrderPatientData patientDataToUpdate = getTransportOrderPatientDataById(id);

        validatePatientDataNotAnonymized(patientDataToUpdate);
        validateTransportOrderCanReceivePatientData(patientDataToUpdate.getTransportOrder());

        if (request.getTransportOrderId() != null) {

            TransportOrder transportOrder = transportOrderService
                    .getTransportOrderByIdWithAccessCheck(request.getTransportOrderId());

            validateTransportOrderCanReceivePatientData(transportOrder);

            patientDataToUpdate.setTransportOrder(transportOrder);
        }

        if (request.getPatientFirstName() != null) {
            patientDataToUpdate.setPatientFirstName(normalizeRequiredText(request.getPatientFirstName()));
        }

        if (request.getPatientLastName() != null) {
            patientDataToUpdate.setPatientLastName(normalizeRequiredText(request.getPatientLastName()));
        }
        if (request.getPickupDetails() != null) {
            patientDataToUpdate.setPickupDetails(normalizeNullableText(request.getPickupDetails()));
        }
        return transportOrderPatientDataRepository.save(patientDataToUpdate);
    }

    @Transactional
    public void deleteTransportOrderPatientData(long id) {
        TransportOrderPatientData patientData = getTransportOrderPatientDataById(id);

        validateTransportOrderCanReceivePatientData(patientData.getTransportOrder());
        validatePatientDataNotAnonymized(patientData);

        transportOrderPatientDataRepository.delete(patientData);
    }

//TODO AUTOANONIMIZACJA Scheduler

    @Transactional
    public TransportOrderPatientData anonymizeTransportOrderPatientData(long id) {
        TransportOrderPatientData patientData = getTransportOrderPatientDataById(id);

        patientData.setPatientFirstName(null);
        patientData.setPatientLastName(null);
        patientData.setPickupDetails(null);
        patientData.setAnonymizedAt(LocalDateTime.now());

        return transportOrderPatientDataRepository.save(patientData);
    }

    @Transactional
    public List<TransportOrderPatientData> anonymizePatientsByTransportOrderId(Long transportOrderId) {

        TransportOrder transportOrder = transportOrderService.getTransportOrderByIdWithAccessCheck(transportOrderId);

        List<TransportOrderPatientData> patients =
                transportOrderPatientDataRepository.findByTransportOrderId(transportOrder.getId());

        LocalDateTime now = LocalDateTime.now();

        for (TransportOrderPatientData patientData : patients) {
            patientData.setPatientFirstName(null);
            patientData.setPatientLastName(null);
            patientData.setPickupDetails(null);
            patientData.setAnonymizedAt(now);
        }

        return transportOrderPatientDataRepository.saveAll(patients);
    }

    @Transactional
    public TransportOrderPatientData addPatientToTransportOrder(
            Long transportOrderId,
            TransportOrderPatientCreateItemRequest request
    ) {
        TransportOrder transportOrder = transportOrderService.getTransportOrderByIdWithAccessCheck(transportOrderId);

        validateTransportOrderCanReceivePatientData(transportOrder);

        TransportOrderPatientData patientData = new TransportOrderPatientData();

        patientData.setTransportOrder(transportOrder);
        patientData.setPatientFirstName(normalizeRequiredText(request.getPatientFirstName()));
        patientData.setPatientLastName(normalizeRequiredText(request.getPatientLastName()));
        patientData.setPickupDetails(normalizeNullableText(request.getPickupDetails()));

        return transportOrderPatientDataRepository.save(patientData);
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

    private String normalizeRequiredText(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(ErrorCode.TRANSPORT_ORDER_INVALID_REQUEST);
        }

        return value.trim();

    }
    private void validatePatientDataNotAnonymized(TransportOrderPatientData patientData) {
        if (patientData.getAnonymizedAt() != null) {
            throw new ApiException(ErrorCode.PATIENT_ALREADY_ANONYMIZED);
        }
    }
}
