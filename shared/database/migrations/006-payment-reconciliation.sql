
-- Conciliación de pagos de Mercado Pago
-- Mundo Fitness Management

-- Permitir registrar pagos aprobados que requieren revisión.
ALTER TABLE membership_checkout_orders
DROP CONSTRAINT IF EXISTS membership_checkout_orders_status_check;

ALTER TABLE membership_checkout_orders
ADD CONSTRAINT membership_checkout_orders_status_check
CHECK (
  status IN (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'requires_review'
  )
);

-- Motivo por el que la compra requiere revisión.
ALTER TABLE membership_checkout_orders
ADD COLUMN IF NOT EXISTS review_reason VARCHAR(255);

-- Fecha en que se detectó la incidencia.
ALTER TABLE membership_checkout_orders
ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;

-- Facilitar la consulta de órdenes pendientes de revisión.
CREATE INDEX IF NOT EXISTS idx_checkout_orders_review
ON membership_checkout_orders(status, review_requested_at)
WHERE status = 'requires_review';
