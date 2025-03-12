DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

CREATE TABLE "Users" (
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    update_password_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    games INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0
);



CREATE TABLE "Games" (
    game_id TEXT PRIMARY KEY,
    type VARCHAR(10) CHECK (type IN ('Blitz', 'Rapid', 'Bullet')),
    white_id TEXT NOT NULL,
    black_id TEXT NOT NULL,
    fen TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    game_status TEXT NOT NULL,
    winner TEXT
);

CREATE TABLE "Moves" (
    move_id SERIAL PRIMARY KEY,
    game_id TEXT REFERENCES "Games"(game_id) ON DELETE CASCADE,
    from_square TEXT NOT NULL,
    to_square TEXT NOT NULL,
    promotion TEXT,
    time TIMESTAMP NOT NULL
);

CREATE INDEX idx_moves_game_id ON "Moves"(game_id);


SELECT * FROM "Users";
SELECT * FROM "Games";
SELECT * FROM "Moves";