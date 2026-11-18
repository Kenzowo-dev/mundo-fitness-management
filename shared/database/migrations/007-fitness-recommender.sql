-- Recomendador Fitness - Mundo Fitness Management
-- Migracion 007

CREATE TABLE IF NOT EXISTS fitness_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL UNIQUE
        REFERENCES clients(id) ON DELETE CASCADE,
    fitness_level VARCHAR(20) NOT NULL
        CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    training_location VARCHAR(20) NOT NULL
        CHECK (training_location IN ('home', 'gym', 'both')),
    equipment JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(equipment) = 'array'),
    days_per_week INTEGER NOT NULL
        CHECK (days_per_week BETWEEN 1 AND 7),
    session_minutes INTEGER NOT NULL
        CHECK (session_minutes BETWEEN 15 AND 120),
    preferred_goal VARCHAR(30) NOT NULL
        CHECK (preferred_goal IN (
            'weight', 'muscle', 'body_fat',
            'endurance', 'strength', 'general'
        )),
    mobility_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fitness_plans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL
        REFERENCES clients(id) ON DELETE CASCADE,
    profile_snapshot JSONB NOT NULL
        CHECK (jsonb_typeof(profile_snapshot) = 'object'),
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fitness_workout_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id BIGINT NOT NULL
        REFERENCES fitness_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL
        CHECK (day_number BETWEEN 1 AND 7),
    title VARCHAR(150) NOT NULL,
    estimated_minutes INTEGER NOT NULL
        CHECK (estimated_minutes BETWEEN 1 AND 180),
    warmup JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(warmup) = 'array'),
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(exercises) = 'array'),
    cooldown JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(cooldown) = 'array'),
    UNIQUE (plan_id, day_number)
);

CREATE TABLE IF NOT EXISTS fitness_workout_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id BIGINT NOT NULL
        REFERENCES fitness_workout_sessions(id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL
        REFERENCES clients(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER
        CHECK (duration_minutes BETWEEN 1 AND 300),
    perceived_effort INTEGER
        CHECK (perceived_effort BETWEEN 1 AND 10),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_fitness_plans_client
    ON fitness_plans(client_id);

CREATE INDEX IF NOT EXISTS idx_fitness_sessions_plan
    ON fitness_workout_sessions(plan_id);

CREATE INDEX IF NOT EXISTS idx_fitness_logs_client_date
    ON fitness_workout_logs(client_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fitness_logs_session
    ON fitness_workout_logs(session_id);
