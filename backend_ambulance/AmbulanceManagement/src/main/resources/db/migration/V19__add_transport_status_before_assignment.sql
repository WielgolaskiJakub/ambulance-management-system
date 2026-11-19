ALTER TABLE route_orders
ADD COLUMN transport_status_before_assignment VARCHAR(32)
CHECK (transport_status_before_assignment IN ('NEW', 'WAITING_FOR_PICKUP'));