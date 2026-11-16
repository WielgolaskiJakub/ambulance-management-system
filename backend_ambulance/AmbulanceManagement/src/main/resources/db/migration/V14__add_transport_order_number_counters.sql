CREATE TABLE transport_order_number_counters (
    number_year SMALLINT PRIMARY KEY,
    last_number INTEGER NOT NULL CHECK ( last_number >= 0 )
);

ALTER TABLE transport_orders
    ALTER COLUMN order_number SET NOT NULL;

ALTER TABLE transport_orders
ADD CONSTRAINT uq_transport_orders_order_number
UNIQUE (order_number);