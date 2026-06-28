CREATE TABLE ambulances
(

    id                       BIGSERIAL PRIMARY KEY,
    car_brand                VARCHAR(100)  NOT NULL,
    model                    VARCHAR(100)  NOT NULL,
    registration_plates      VARCHAR(20)   NOT NULL UNIQUE,
    mileage                  INTEGER       NOT NULL CHECK ( mileage >= 0 ),
    average_fuel_consumption DECIMAL(5, 2) NOT NULL CHECK ( average_fuel_consumption > 0 ),
    tank_capacity_liters     DECIMAL(6, 2) NOT NULL CHECK (tank_capacity_liters > 0),
    status                   VARCHAR(50)   NOT NULL,
    active                   BOOLEAN       NOT NULL DEFAULT TRUE
);