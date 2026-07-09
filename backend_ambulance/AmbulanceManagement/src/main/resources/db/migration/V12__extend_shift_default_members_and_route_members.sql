ALTER TABLE shift_default_members
ALTER COLUMN end_time DROP NOT NULL;

ALTER TABLE route_members
ADD COLUMN origin_shift_id BIGINT;

ALTER TABLE route_members
ADD CONSTRAINT fk_route_members_origin_shift
FOREIGN KEY (origin_shift_id) REFERENCES shifts(id);