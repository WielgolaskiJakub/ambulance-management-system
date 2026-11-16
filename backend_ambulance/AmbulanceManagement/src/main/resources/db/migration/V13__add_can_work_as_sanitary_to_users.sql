ALTER TABLE users
ADD COLUMN can_work_as_sanitary BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET can_work_as_sanitary = TRUE
where users.role = 'SANITARY';
