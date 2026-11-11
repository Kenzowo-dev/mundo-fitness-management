-- Checkout de membresias - Mundo Fitness Management

CREATE TABLE IF NOT EXISTS membership_checkout_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    payment_id BIGINT UNIQUE REFERENCES payments(id) ON DELETE SET NULL,

    provider VARCHAR(30) NOT NULL DEFAULT 'mercadopago',
    provider_preference_id VARCHAR(150),
    provider_payment_id VARCHAR(150) UNIQUE,

    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_client
ON membership_checkout_orders(client_id);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_status
ON membership_checkout_orders(status);
