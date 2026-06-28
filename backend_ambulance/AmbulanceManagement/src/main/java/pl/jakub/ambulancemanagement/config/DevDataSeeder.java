package pl.jakub.ambulancemanagement.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pl.jakub.ambulancemanagement.ambulances.model.Ambulance;
import pl.jakub.ambulancemanagement.ambulances.model.AmbulanceStatus;
import pl.jakub.ambulancemanagement.ambulances.repository.AmbulanceRepository;
import pl.jakub.ambulancemanagement.shifts.model.Shift;
import pl.jakub.ambulancemanagement.shifts.model.ShiftStatus;
import pl.jakub.ambulancemanagement.shifts.model.ShiftType;
import pl.jakub.ambulancemanagement.shifts.repository.ShiftRepository;
import pl.jakub.ambulancemanagement.transport_orders.model.*;
import pl.jakub.ambulancemanagement.transport_orders.repository.TransportOrderRepository;
import pl.jakub.ambulancemanagement.users.model.User;
import pl.jakub.ambulancemanagement.users.model.UserRole;
import pl.jakub.ambulancemanagement.users.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final ShiftRepository shiftRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername("admin")) {
            return;
        }

        User admin = createUser("Admin", "Systemowy", "admin", "admin@test.pl", UserRole.ADMIN);
        User manager = createUser("Kierownik", "Transportu", "manager", "manager@test.pl", UserRole.MANAGER);
        User driver = createUser("Jan", "Kierowca", "driver", "driver@test.pl", UserRole.DRIVER);
        User sanitary = createUser("Adam", "Sanitariusz", "sanitary", "sanitary@test.pl", UserRole.SANITARY);

        Ambulance ambulance = new Ambulance();
        ambulance.setCarBrand("Mercedes");
        ambulance.setModel("Sprinter");
        ambulance.setRegistrationPlates("WWL 12345");
        ambulance.setMileage(250000);
        ambulance.setSummerFuelConsumptionNorm(new BigDecimal("12.50"));
        ambulance.setWinterFuelConsumptionNorm(new BigDecimal("14.00"));
        ambulance.setTankCapacityLiters(new BigDecimal("75.00"));
        ambulance.setStatus(AmbulanceStatus.AVAILABLE);
        ambulance.setActive(true);
        ambulanceRepository.save(ambulance);

        Shift shift = new Shift();
        shift.setDriver(driver);
        shift.setAmbulance(ambulance);
        shift.setShiftType(ShiftType.FULL_24H);
        shift.setCreatedBy(driver);
        shift.setStartTime(LocalDateTime.now().minusHours(1));
        shift.setEndTime(LocalDateTime.now().plusHours(23));
        shift.setStatus(ShiftStatus.ACTIVE);
        shiftRepository.save(shift);

        createOrder("001/DEV", TransportOrderType.CONSULTATION, TransportSource.WARD,
                "Szpital Wołomin - Oddział wewnętrzny", "Warszawa, Madalińskiego",
                "Konsultacja pacjenta, transport tam i powrót", manager);

        createOrder("002/DEV", TransportOrderType.HOSPITAL_TRANSFER, TransportSource.WARD,
                "Szpital Wołomin - SOR", "Warszawa, Banacha",
                "Przekazanie pacjenta do innego szpitala", manager);

        createOrder(null, TransportOrderType.OTHER, TransportSource.NIGHT_MEDICAL_ASSISTANCE,
                "NPL Wołomin", "Adres pacjenta z NPL",
                "Zlecenie utworzone przez kierowcę, numer nada kierownik", driver);

        createOrder(null, TransportOrderType.MEDICAL_DOCUMENTATION, TransportSource.MANAGEMENT,
                "Szpital Wołomin", "Warszawa, Madalińskiego",
                "APTEKA / dokumentacja / transport techniczny", manager);
    }

    private User createUser(String firstName, String lastName, String username, String email, UserRole role) {
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Password123"));
        user.setUserRole(role);
        user.setActive(true);
        user.setMustChangePassword(false);
        return userRepository.save(user);
    }

    private void createOrder(
            String orderNumber,
            TransportOrderType type,
            TransportSource source,
            String pickupAddress,
            String destinationAddress,
            String description,
            User createdBy
    ) {
        TransportOrder order = new TransportOrder();
        order.setOrderNumber(orderNumber);
        order.setOrderType(type);
        order.setSource(source);
        order.setPriority(TransportPriority.MEDIUM);
        order.setStatus(TransportStatus.NEW);
        order.setPickupAddress(pickupAddress);
        order.setDestinationAddress(destinationAddress);
        order.setDescription(description);
        order.setCreatedBy(createdBy);
        transportOrderRepository.save(order);
    }
}