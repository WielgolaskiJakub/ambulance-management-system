package pl.jakub.ambulancemanagement.refuelings.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.service.AmbulanceService;
import pl.jakub.ambulancemanagement.auth.security.CurrentUserService;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingCreateRequest;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingManagerUpdateRequest;
import pl.jakub.ambulancemanagement.refuelings.dto.RefuelingUserUpdateRequest;
import pl.jakub.ambulancemanagement.refuelings.model.Refueling;
import pl.jakub.ambulancemanagement.refuelings.model.RefuelingStatus;
import pl.jakub.ambulancemanagement.refuelings.repository.RefuelingRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.shifts.service.ShiftService;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.service.UserService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefuelingService {

    private final RefuelingRepository refuelingRepository;
    private final UserService userService;
    private final ShiftService  shiftService;
    private final AmbulanceService ambulanceService;
    private final CurrentUserService currentUserService;
    private final ShiftRepository shiftRepository;

    public List<Refueling> getAllRefuelings() {
        return refuelingRepository.findAll();
    }

    public Refueling getRefuelingById(Long id) {
        return refuelingRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.REFUELING_NOT_FOUND));
    }

    public List<Refueling> getMyRefuelings() {
        User currentUser = currentUserService.getCurrentUser();

        return refuelingRepository.findByDriverIdOrderByRefuelingAtDesc(currentUser.getId());
    }

    @Transactional
    public Refueling createRefueling(RefuelingCreateRequest request) {

        User currentUser = currentUserService.getCurrentUser();

        Shift shift = shiftRepository.findByDriver_IdAndStatus(
                currentUser.getId(),
                ShiftStatus.ACTIVE
        ).orElseThrow(() -> new ApiException(ErrorCode.SHIFT_NOT_ACTIVE));

        Ambulance ambulance = shift.getAmbulance();

        if (request.getMileageAtRefueling() < ambulance.getMileage()) {
            throw new ApiException(ErrorCode.INVALID_REFUELING_MILEAGE);
        }

        Refueling refueling = new Refueling();
        refueling.setDriver(currentUser);
      refueling.setShift(shift);
      refueling.setAmbulance(ambulance);

      refueling.setLiters(request.getLiters());
      refueling.setMileageAtRefueling(request.getMileageAtRefueling());
      refueling.setNotes(request.getDriverNotes());
      refueling.setFullTank(true);
      refueling.setStatus(RefuelingStatus.REPORTED);
      refueling.setRefuelingAt(LocalDateTime.now());

      ambulance.setEstimatedFuelLiters((ambulance.getTankCapacityLiters()));
      ambulance.setFuelEstimateUpdatedAt(LocalDateTime.now());

      return  refuelingRepository.save(refueling);
    }

    @Transactional
    public Refueling updateRefuelingByUser(RefuelingUserUpdateRequest request,  Long id) {

       User currentUser = currentUserService.getCurrentUser();

        Refueling refueling = getRefuelingById(id);

        if(!refueling.getDriver().getId().equals(currentUser.getId())) {
            throw new ApiException(ErrorCode.REFUELING_ACCESS_DENIED);
        }

        if (refueling.getStatus() != RefuelingStatus.REPORTED) {
            throw new ApiException(ErrorCode.REFUELING_ALREADY_VERIFIED);
        }

        if (request.getMileageAtRefueling() != null) {
            if (request.getMileageAtRefueling() < refueling.getAmbulance().getMileage()) {
                throw new ApiException(ErrorCode.INVALID_REFUELING_MILEAGE);
            }

            refueling.setMileageAtRefueling(request.getMileageAtRefueling());
        }
        if(request.getLiters() != null){
            refueling.setLiters(request.getLiters());
        }
        if(request.getDriverNotes() != null){
            refueling.setNotes(request.getDriverNotes());
        }
        return  refuelingRepository.save(refueling);
    }

    public Refueling updateRefuelingByManager(RefuelingManagerUpdateRequest request, Long id) {

        User currentManager = currentUserService.getCurrentUser();
        Refueling refueling = getRefuelingById(id);

        if(request.getInvoiceNumber() != null) {
            refueling.setInvoiceNumber(request.getInvoiceNumber());
        }

        if(request.getTotalCost() != null) {
            refueling.setTotalCost(request.getTotalCost());
        }

        if(request.getStatus() == null) {
            throw new ApiException(ErrorCode.INVALID_REFUELING_STATUS);
        }
        if (request.getStatus() == RefuelingStatus.REPORTED) {
            throw new ApiException(ErrorCode.INVALID_REFUELING_STATUS);
        }
            refueling.setStatus(request.getStatus());

        if(request.getManagerNotes() != null) {
            refueling.setNotes(request.getManagerNotes());
        }


        refueling.setVerifiedBy(currentManager);
        refueling.setVerifiedAt(LocalDateTime.now());

        return refuelingRepository.save(refueling);
    }
}
