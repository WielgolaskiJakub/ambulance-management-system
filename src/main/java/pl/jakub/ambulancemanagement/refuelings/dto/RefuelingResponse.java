package pl.jakub.ambulancemanagement.refuelings.dto;

import lombok.Getter;
import lombok.Setter;
import pl.jakub.ambulancemanagement.refuelings.model.Refueling;
import pl.jakub.ambulancemanagement.refuelings.model.RefuelingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class RefuelingResponse {

    private Long id;

    private Long ambulanceId;
    private String ambulanceRegistrationPlates;
    private String ambulanceModel;

    private Long driverId;
    private String driverFullName;

    private Long shiftId;

    private LocalDateTime refuelingAt;
    private Integer liters;
    private Integer mileageAtRefueling;
    private Boolean fullTank;

    private RefuelingStatus status;

    private String invoiceNumber;
    private BigDecimal totalCost;

    private Long verifiedById;
    private String verifiedByFullName;
    private LocalDateTime verifiedAt;

    private String notes;
    private LocalDateTime createdAt;

    private BigDecimal estimatedFuelLiters;

    public static RefuelingResponse fromEntity(Refueling refueling) {
        RefuelingResponse response = new RefuelingResponse();

        response.setId(refueling.getId());

        response.setAmbulanceId(refueling.getAmbulance().getId());
        response.setAmbulanceRegistrationPlates(refueling.getAmbulance().getRegistrationPlates());
        response.setAmbulanceModel(
                refueling.getAmbulance().getCarBrand() + " " + refueling.getAmbulance().getModel()
        );

        response.setDriverId(refueling.getDriver().getId());
        response.setDriverFullName(
                refueling.getDriver().getFirstName() + " " + refueling.getDriver().getLastName()
        );

        response.setShiftId(refueling.getShift().getId());

        response.setRefuelingAt(refueling.getRefuelingAt());
        response.setLiters(refueling.getLiters());
        response.setMileageAtRefueling(refueling.getMileageAtRefueling());
        response.setFullTank(refueling.getFullTank());

        response.setStatus(refueling.getStatus());

        response.setInvoiceNumber(refueling.getInvoiceNumber());
        response.setTotalCost(refueling.getTotalCost());

        if (refueling.getVerifiedBy() != null) {
            response.setVerifiedById(refueling.getVerifiedBy().getId());
            response.setVerifiedByFullName(
                    refueling.getVerifiedBy().getFirstName() + " " + refueling.getVerifiedBy().getLastName()
            );
        }

        response.setVerifiedAt(refueling.getVerifiedAt());

        response.setNotes(refueling.getNotes());
        response.setCreatedAt(refueling.getCreatedAt());

        response.setEstimatedFuelLiters(refueling.getAmbulance().getEstimatedFuelLiters());

        return response;
    }
}