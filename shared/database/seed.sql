-- ============================================================================
-- MUNDO FITNESS - SEMILLAS DE DATOS INICIALES (SEEDS)
-- Datos locales para cuentas demo, socios, membresías y planes disponibles.
-- LOCAL ONLY: ejecutar el seed restablece las credenciales de las cuentas demo.
-- ============================================================================

-- 1. Roles del Sistema
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'Acceso total y administración del sistema', '["*"]'),
    ('receptionist', 'Gestión de clientes, cobros, accesos y membresías', '["clients:read", "clients:write", "memberships:read", "memberships:write", "payments:read", "payments:write"]'),
    ('member', 'Acceso a perfil, membresías y pagos propios', '["profile:read", "profile:write", "memberships:read", "payments:read"]')
ON CONFLICT (name) DO NOTHING;

-- 2. Usuarios Iniciales del Sistema
-- Contraseña para todos los usuarios predeterminados: Admin1234!
-- Hash bcrypt (12 rounds): $2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified) VALUES
    ('admin@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Administrador', 'Principal', '+51987654321', 'admin', true, true),
    ('recepcion@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Laura', 'Recepción', '+51987654323', 'receptionist', true, true),
    ('socio@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Juan', 'Pérez', '+51987654324', 'member', true, true)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- 3. Asignación de Roles en Tabla Junction
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE (u.email = 'admin@mundofitness.com' AND r.name = 'admin')
   OR (u.email = 'recepcion@mundofitness.com' AND r.name = 'receptionist')
   OR (u.email = 'socio@mundofitness.com' AND r.name = 'member')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. Cliente Inicial para Demostración
INSERT INTO clients (user_id, dni, first_name, last_name, email, phone, birth_date, gender, address, status, joined_at)
SELECT u.id, '76543210', 'Juan', 'Pérez', 'socio@mundofitness.com', '+51987654324', '1995-06-15', 'masculino', 'Av. Principal 123, Lima', 'active', CURRENT_DATE
FROM users u WHERE u.email = 'socio@mundofitness.com'
ON CONFLICT (dni) DO NOTHING;

-- 5. Planes de Membresía
INSERT INTO membership_plans
(
    name,
    description,
    duration_days,
    price,
    currency,
    features,
    max_visits_per_week,
    includes_personal_trainer,
    includes_classes,
    includes_sauna,
    is_active,
    sort_order
)
VALUES
(
    'Plan Básico Mensual',
    'Acceso libre al área de máquinas y pesas',
    30,
    29.99,
    'USD',
    '["Acceso a sala de musculación", "Casillero estándar"]',
    3,
    false,
    false,
    false,
    true,
    1
),
(
    'Plan Estándar Completo',
    'Acceso integral con todas las clases grupales incluidas',
    30,
    49.99,
    'USD',
    '["Acceso total a máquinas", "Clases de Spinning y Yoga", "Duchas y vestuarios"]',
    5,
    false,
    true,
    false,
    true,
    2
),
(
    'Plan Premium VIP',
    'Acceso total e ilimitado con sesiones de entrenador personal',
    30,
    99.99,
    'USD',
    '["Acceso ilimitado 24/7", "Todas las clases", "2 sesiones con Entrenador Personal", "Zona de Sauna y Spa"]',
    NULL,
    true,
    true,
    true,
    true,
    3
),
(
    'Plan Anual Élite',
    'Membresía anual con descuento preferencial del 25%',
    365,
    399.99,
    'USD',
    '["Acceso ilimitado anual", "Evaluación médica mensual", "Pases de cortesía para invitados (2/mes)", "Sauna y toallas"]',
    NULL,
    true,
    true,
    true,
    true,
    4
)
ON CONFLICT DO NOTHING;

-- 6. Membresía vigente para el cliente demo, sin IDs hardcodeados.
INSERT INTO client_memberships (client_id, plan_id, start_date, end_date, status, auto_renew)
SELECT c.id, p.id, CURRENT_DATE, CURRENT_DATE + p.duration_days, 'active', false
FROM clients c
CROSS JOIN membership_plans p
WHERE c.dni = '76543210'
  AND p.name = 'Plan Básico Mensual'
  AND NOT EXISTS (
      SELECT 1 FROM client_memberships cm
      WHERE cm.client_id = c.id AND cm.status = 'active' AND cm.end_date >= CURRENT_DATE
  );
