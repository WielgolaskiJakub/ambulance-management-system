CREATE TABLE users
(
    id                   BIGSERIAL PRIMARY KEY,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    role                 VARCHAR(50)  NOT NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active               BOOLEAN         NOT NULL,
    must_change_password BOOLEAN      NOT NULL DEFAULT TRUE
);