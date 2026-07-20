package pl.jakub.ambulancemanagement.transport_orders.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TransportOrderNumberService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public String generateOrderNumber() {
        int currentYear = LocalDate.now().getYear();

        Integer nextNumber = jdbcTemplate.queryForObject(
                """
                        INSERT INTO transport_order_number_counters (number_year, last_number)
                        VALUES (?, 1)
                        ON CONFLICT (number_year)
                        DO UPDATE SET last_number = transport_order_number_counters.last_number + 1
                        RETURNING last_number
                        """,
                Integer.class,
                currentYear
        );

        return nextNumber + "/" + String.format("%02d", currentYear % 100);
    }
}
