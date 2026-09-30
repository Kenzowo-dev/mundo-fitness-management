-- Solicitudes web de renovación: no crean membresías ni pagos.
CREATE TABLE IF NOT EXISTS membership_renewal_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'contacted', 'closed')),
    member_note VARCHAR(500),
    staff_note VARCHAR(500),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    handled_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_renewal_requests_status_requested_at
    ON membership_renewal_requests(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_client_id
    ON membership_renewal_requests(client_id, requested_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_renewal_requests_open_client
    ON membership_renewal_requests(client_id) WHERE status IN ('pending', 'contacted');
