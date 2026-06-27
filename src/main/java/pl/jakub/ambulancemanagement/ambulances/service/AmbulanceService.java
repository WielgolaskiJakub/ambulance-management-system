package pl.jakub.ambulancemanagement.ambulances.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.jakub.ambulancemanagement.ambulances.dto.CreateAmbulanceRequest;
import pl.jakub.ambulancemanagement.ambulances.dto.UpdateAmbulanceRequest;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;
import pl.jakub.ambulancemanagement.ambulances.repository.AmbulanceRepository;
import pl.jakub.ambulancemanagement.exception.ApiException;
import pl.jakub.ambulancemanagement.exception.ErrorCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmbulanceService {

    private final AmbulanceRepository ambulanceRepository;

    public List<Ambulance> getAllAmbulances() {
        return ambulanceRepository.findAll();
    }

    public Ambulance getAmbulanceById(long id) {
        return ambulanceRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.AMBULANCE_NOT_FOUND));
    }

    public List<Ambulance> getAvailableAmbulances() {
        return ambulanceRepository.findByStatusAndActive_True(AmbulanceStatus.AVAILABLE);
    }

    public Ambulance createAmbulance(CreateAmbulanceRequest request) {
        String registrationPlates = request.getRegistrationPlates().trim().toUpperCase();

        if (ambulanceRepository.existsByRegistrationPlates(registrationPlates)) {
            throw new ApiException(ErrorCode.AMBULANCE_ALREADY_EXIST);
        }
        Ambulance ambulance = new Ambulance();
        ambulance.setCarBrand(request.getCarBrand());
        ambulance.setModel(request.getModel());
        ambulance.setRegistrationPlates(registrationPlates);
        ambulance.setMileage(request.getMileage());
        ambulance.setSummerFuelConsumptionNorm(request.getSummerFuelConsumptionNorm());
        ambulance.setWinterFuelConsumptionNorm(request.getWinterFuelConsumptionNorm());
        ambulance.setTankCapacityLiters(request.getTankCapacityLiters());
        ambulance.setStatus(AmbulanceStatus.AVAILABLE);
        ambulance.setActive(true);
        return ambulanceRepository.save(ambulance);
    }

    public Ambulance updateAmbulance(UpdateAmbulanceRequest request, long id) {
        Ambulance ambulanceToUpdate = getAmbulanceById(id);

        if (request.getRegistrationPlates() != null) {
            if (request.getRegistrationPlates().isBlank()) {
                throw new ApiException(ErrorCode.AMBULANCE_INVALID_REQUEST);
            }
            String registrationPlates = request.getRegistrationPlates().trim().toUpperCase();
            boolean registrationPlatesChanged = !ambulanceToUpdate.getRegistrationPlates()
                    .equals(registrationPlates);
            boolean registrationPlatesAlreadyExist = ambulanceRepository
                    .existsByRegistrationPlates(registrationPlates);
            if (registrationPlatesChanged && registrationPlatesAlreadyExist) {
                throw new ApiException(ErrorCode.AMBULANCE_ALREADY_EXIST);
            }
            ambulanceToUpdate.setRegistrationPlates(registrationPlates);
        }
        if (request.getMileage() != null) {
            ambulanceToUpdate.setMileage(request.getMileage());
        }
        if (request.getSummerFuelConsumptionNorm() != null) {
            ambulanceToUpdate.setSummerFuelConsumptionNorm(request.getSummerFuelConsumptionNorm());
        }
        if (request.getWinterFuelConsumptionNorm() != null) {
            ambulanceToUpdate.setWinterFuelConsumptionNorm(request.getWinterFuelConsumptionNorm());
        }
        if (request.getStatus() != null) {
            ambulanceToUpdate.setStatus(request.getStatus());
        }
        if (request.getActive() != null) {
            ambulanceToUpdate.setActive(request.getActive());
        }
        return ambulanceRepository.save(ambulanceToUpdate);
    }

    public Ambulance markAmbulanceOutOfService(long id) {
        Ambulance ambulance = getAmbulanceById(id);

        if (!ambulance.getActive()) {
            throw new ApiException(ErrorCode.AMBULANCE_NOT_ACTIVE);
        }

        if (ambulance.getStatus() == AmbulanceStatus.IN_USE) {
            throw new ApiException(ErrorCode.AMBULANCE_CURRENTLY_IN_USE);
        }

        ambulance.setStatus(AmbulanceStatus.OUT_OF_SERVICE);

        return ambulanceRepository.save(ambulance);
    }

    public Ambulance markAmbulanceAvailable(long id) {
        Ambulance ambulance = getAmbulanceById(id);

        if (!ambulance.getActive()) {
            throw new ApiException(ErrorCode.AMBULANCE_NOT_ACTIVE);
        }

        if (ambulance.getStatus() == AmbulanceStatus.IN_USE) {
            throw new ApiException(ErrorCode.AMBULANCE_CURRENTLY_IN_USE);
        }

        ambulance.setStatus(AmbulanceStatus.AVAILABLE);

        return ambulanceRepository.save(ambulance);
    }

    public void deactivateAmbulanceById(long id) {
        Ambulance ambulanceToDelete = getAmbulanceById(id);
        ambulanceToDelete.setActive(false);
        ambulanceToDelete.setStatus(AmbulanceStatus.OUT_OF_SERVICE);
        ambulanceRepository.save(ambulanceToDelete);

    }
}
