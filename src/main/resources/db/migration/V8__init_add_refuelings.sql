CREATE TABLE refuelings
(

    id                   BIGSERIAL PRIMARY KEY,
    ambulance_id         BIGINT      NOT NULL,
    driver_id            BIGINT      NOT NULL,
    shift_id             BIGINT      NOT NULL,
    refueling_at         TIMESTAMP   NOT NULL,
    liters               INTEGER     NOT NULL,
    mileage_at_refueling INTEGER     NOT NULL,
    status               VARCHAR(50) NOT NULL,
    full_tank            BOOLEAN     NOT NULL DEFAULT TRUE,
    invoice_number       VARCHAR(100),
    total_cost           DECIMAL(10, 2),
    verified_by_id       BIGINT,
    verified_at          TIMESTAMP,
    notes                text,
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refuelings_ambulance_id
        FOREIGN KEY (ambulance_id) REFERENCES ambulances,

    CONSTRAINT fk_refuelings_driver_id
        FOREIGN KEY (driver_id) REFERENCES users,

    CONSTRAINT fk_refuelings_shift_id
        FOREIGN KEY (shift_id) REFERENCES shifts,

    CONSTRAINT fk_refuelings_verified_by_id
        FOREIGN KEY (verified_by_id) REFERENCES users,

    CONSTRAINT chk_refuelings_liters_positive
        CHECK (liters > 0),

    CONSTRAINT chk_refuelings_mileage_non_negative
        CHECK (mileage_at_refueling >= 0),

    CONSTRAINT chk_refuelings_total_cost_non_negative
        CHECK (total_cost IS NULL OR total_cost >= 0)
);

ALTER TABLE ambulances
    ADD COLUMN estimated_fuel_liters    DECIMAL(6, 2),
    ADD COLUMN fuel_estimate_updated_at TIMESTAMP;

CREATE INDEX idx_refuelings_ambulance_id
    ON refuelings (ambulance_id);

CREATE INDEX idx_refuelings_driver_id
    ON refuelings (driver_id);

CREATE INDEX idx_refuelings_shift_id
    ON refuelings (shift_id);

CREATE INDEX idx_refuelings_verified_by_id
    ON refuelings (verified_by_id);

CREATE INDEX idx_refuelings_refueling_at
    ON refuelings (refueling_at);