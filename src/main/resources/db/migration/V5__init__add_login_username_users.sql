ALTER TABLE users
    ADD COLUMN username VARCHAR(100);

UPDATE users
SET username = LOWER(TRIM(email))
WHERE username IS NULL
  AND email IS NOT NULL;

UPDATE users
SET username = 'user_' || id
WHERE username IS NULL;

ALTER TABLE users
    ALTER COLUMN username SET NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT uk_username_users UNIQUE (username);

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;