ALTER TABLE ambulances
RENAME COLUMN average_fuel_consumption TO summer_fuel_consumption_norm;

ALTER TABLE ambulances
ADD COLUMN  winter_fuel_consumption_norm DECIMAL(5,2) NOT NULL DEFAULT 0.01 CHECK ( winter_fuel_consumption_norm >0 );