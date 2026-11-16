ALTER TABLE route_orders
ADD COLUMN position INTEGER;

WITH numbered_route_orders AS (
    SELECT
        id,
        ROW_NUMBER() OVER(
            PARTITION BY route_orders.route_id
            ORDER BY created_at, id
            ) AS position
    FROM route_orders
)
UPDATE route_orders route_order
SET position = numbered_route_orders.position
FROM numbered_route_orders
WHERE route_order.id = numbered_route_orders.id;

ALTER TABLE route_orders
ALTER COLUMN position SET NOT NULL;

ALTER TABLE route_orders
ADD CONSTRAINT chk_route_orders_position_positive
CHECK ( position > 0 );

CREATE INDEX idx_route_orders_route_id_position
ON route_orders (route_id, position);