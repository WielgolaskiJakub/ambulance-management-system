ALTER TABLE routes
    ADD COLUMN fuel_consumption_norm_used     DECIMAL(5, 2),
    ADD COLUMN estimated_fuel_consumed_liters DECIMAL(6, 2);