CREATE TABLE "Users" (
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    update_password_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Guests" (
    guest_id VARCHAR(16) PRIMARY KEY CHECK (LENGTH(guest_id) = 16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guests_createdAt ON "Guests"(created_at);



SELECT * FROM "Users";
SELECT * FROM "Guests";