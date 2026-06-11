CREATE TABLE shifts
(

    id            BIGSERIAL PRIMARY KEY,
    driver_id     BIGINT       NOT NULL,
    ambulance_id  BIGINT       NOT NULL,
    created_by_id BIGINT       NOT NULL,
    shift_type    VARCHAR(50)  NOT NULL,
    start_time    TIMESTAMP    NOT NULL,
    end_time      TIMESTAMP    NOT NULL,
    status        VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shifts_driver
        FOREIGN KEY (driver_id) REFERENCES users (id),
    CONSTRAINT fk_shifts_ambulance
        FOREIGN KEY (ambulance_id) REFERENCES ambulances (id),
    CONSTRAINT fk_shifts_created_by
        FOREIGN KEY (created_by_id) REFERENCES users (id),
    CONSTRAINT chk_shifts_end_after_start
        CHECK (end_time > start_time)
);



CREATE TABLE transport_orders
(
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(100),
    order_type          VARCHAR(50)  NOT NULL,
    source              VARCHAR(100) NOT NULL,
    created_by_id       BIGINT       NOT NUll,
    status              VARCHAR(50)  NOT NULL,
    priority            VARCHAR(50)  NOT NULL,
    pickup_address      VARCHAR(255),
    destination_address VARCHAR(255),
    description         TEXT,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP,
    cancelled_at        TIMESTAMP,
    cancelled_by_id     BIGINT,
    cancel_reason       VARCHAR(100),
    cancel_description  TEXT,
    anonymized_at       TIMESTAMP,

    CONSTRAINT fk_transport_orders_created_by
        FOREIGN KEY (created_by_id) REFERENCES users (id),

    CONSTRAINT fk_transport_orders_cancelled_by
        FOREIGN KEY (cancelled_by_id) REFERENCES users (id)


);

CREATE TABLE routes
(
    id                         BIGSERIAL PRIMARY KEY,
    transport_order_id         BIGINT       NOT NULL,
    shift_id                   BIGINT       NOT NULL,
    start_address              VARCHAR(255) NOT NULL,
    actual_destination_address VARCHAR(255) NOT NULL,
    status                     VARCHAR(50)  NOT NULL,
    distance_km                INTEGER,
    started_at                 TIMESTAMP,
    finished_at                TIMESTAMP,
    notes                      TEXT,
    created_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_routes_order
        FOREIGN KEY (transport_order_id) REFERENCES transport_orders (id),

    CONSTRAINT fk_routes_shift
        FOREIGN KEY (shift_id) REFERENCES shifts (id),

    CONSTRAINT chk_routes_finished_after_started
        CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at > started_at),

    CONSTRAINT chk_routes_distance_positive
        CHECK (distance_km IS NULL OR distance_km >= 0)
);

CREATE TABLE crew_duties
(
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    role       VARCHAR(100) NOT NULL,
    start_time TIMESTAMP    NOT NULL,
    end_time   TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_crew_duties_user_id
        FOREIGN KEY (user_id) REFERENCES users (id),

    CONSTRAINT chk_crew_duties_end_after_start
        CHECK ( end_time > start_time )
);

CREATE TABLE shift_default_members
(
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    shift_id   BIGINT       NOT NULL,
    role       VARCHAR(100) NOT NULL,
    start_time TIMESTAMP    NOT NULL,
    end_time   TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_shift_default_members_user
        FOREIGN KEY (user_id) REFERENCES users (id),

    CONSTRAINT fk_shift_default_members_shift
        FOREIGN KEY (shift_id) REFERENCES shifts (id),

    CONSTRAINT chk_shift_default_members_end_after_start
        CHECK ( end_time > start_time )
);

CREATE TABLE route_members
(
    id          BIGSERIAL PRIMARY KEY,
    route_id    BIGINT       NOT NULL,
    user_id     BIGINT,
    member_name VARCHAR(255),
    role        VARCHAR(100) NOT NULL,
    source      VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_route_members_route
        FOREIGN KEY (route_id) REFERENCES routes (id),

    CONSTRAINT fk_route_members_user
        FOREIGN KEY (user_id) REFERENCES users (id),

    CONSTRAINT chk_route_members_user_or_name
        CHECK (
            user_id IS NOT NULL
                OR length(trim(coalesce(member_name, ''))) > 0
            )
);

CREATE TABLE transport_order_patient_data
(
    id                 BIGSERIAL PRIMARY KEY,
    transport_order_id BIGINT       NOT NULL,
    patient_first_name VARCHAR(100),
    patient_last_name  VARCHAR(100),
    pickup_details     VARCHAR(255),
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    anonymized_at      TIMESTAMP,

    CONSTRAINT fk_transport_order_patient_data_order
        FOREIGN KEY (transport_order_id) REFERENCES transport_orders (id)
);


CREATE INDEX idx_route_members_route
    ON route_members (route_id);

CREATE INDEX idx_route_members_user
    ON route_members (user_id);

CREATE INDEX idx_shift_default_members_user
    ON shift_default_members (user_id);

CREATE INDEX idx_shift_default_members_shift
    ON shift_default_members (shift_id);

CREATE INDEX idx_crew_duties_user_id
    ON crew_duties (user_id);

CREATE INDEX idx_crew_duties_start_time
    ON crew_duties (start_time);

CREATE INDEX idx_transport_orders_created_by_id
    ON transport_orders (created_by_id);

CREATE INDEX idx_transport_orders_status
    ON transport_orders (status);

CREATE INDEX idx_transport_orders_created_at
    ON transport_orders (created_at);

CREATE INDEX idx_transport_orders_cancelled_by_id
    ON transport_orders (cancelled_by_id);

CREATE INDEX idx_shifts_driver_id
    ON shifts (driver_id);

CREATE INDEX idx_shifts_ambulance_id
    ON shifts (ambulance_id);

CREATE INDEX idx_shifts_start_time
    ON shifts (start_time);

CREATE INDEX idx_shifts_status
    ON shifts (status);

CREATE INDEX idx_routes_transport_order_id
    ON routes (transport_order_id);

CREATE INDEX idx_routes_shift_id
    ON routes (shift_id);

CREATE INDEX idx_routes_started_at
    ON routes (started_at);