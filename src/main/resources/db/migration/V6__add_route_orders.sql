CREATE TABLE route_orders
(
    id                 BIGSERIAL PRIMARY KEY,
    route_id           BIGINT    NOT NULL,
    transport_order_id BIGINT    NOT NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_route_orders_route
        FOREIGN KEY (route_id) REFERENCES routes (id),

    CONSTRAINT fk_route_orders_transport_order
        FOREIGN KEY (transport_order_id) REFERENCES transport_orders (id),

    CONSTRAINT uq_route_order
        UNIQUE (route_id, transport_order_id)
);

CREATE INDEX idx_route_orders_route_id
    ON route_orders (route_id);

CREATE INDEX idx_route_orders_transport_order_id
    ON route_orders (transport_order_id);


ALTER TABLE routes
    DROP CONSTRAINT fk_routes_order;

DROP INDEX IF EXISTS idx_routes_transport_order_id;

ALTER TABLE routes
DROP COLUMN IF EXISTS transport_order_id;
