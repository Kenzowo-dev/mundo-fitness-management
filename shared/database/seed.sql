-- ============================================================================
-- MUNDO FITNESS - SEMILLAS DE DATOS INICIALES (SEEDS)
-- Datos maestros para roles, administrador, planes, ejercicios y widgets
-- ============================================================================

-- 1. Roles del Sistema
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'Acceso total y administración del sistema', '["*"]'),
    ('trainer', 'Gestión de clientes, planes y seguimiento de entrenamientos', '["clients:read", "clients:write", "plans:read", "plans:write", "reports:read"]'),
    ('receptionist', 'Gestión de clientes, cobros, accesos y membresías', '["clients:read", "clients:write", "memberships:read", "memberships:write", "payments:read", "payments:write"]'),
    ('member', 'Acceso básico a perfil, membresía y rutinas asignadas', '["profile:read", "profile:write", "memberships:read", "plans:read", "payments:read"]')
ON CONFLICT (name) DO NOTHING;

-- 2. Usuarios Iniciales del Sistema
-- Contraseña para todos los usuarios predeterminados: Admin1234!
-- Hash bcrypt (12 rounds): $2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified) VALUES
    ('admin@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Administrador', 'Principal', '+51987654321', 'admin', true, true),
    ('entrenador@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Carlos', 'Entrenador', '+51987654322', 'trainer', true, true),
    ('recepcion@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Laura', 'Recepción', '+51987654323', 'receptionist', true, true),
    ('socio@mundofitness.com', '$2a$12$8CrWE0lLeLlL1ovqAobwI.abjtk7nJDRVpJA79l2b5hgInghdLslC', 'Juan', 'Pérez', '+51987654324', 'member', true, true)
ON CONFLICT (email) DO NOTHING;

-- 3. Asignación de Roles en Tabla Junction
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE (u.email = 'admin@mundofitness.com' AND r.name = 'admin')
   OR (u.email = 'entrenador@mundofitness.com' AND r.name = 'trainer')
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

-- 6. Biblioteca Inicial de Ejercicios
INSERT INTO exercises (name, muscle_group, secondary_muscles, equipment, difficulty, instructions) VALUES
    ('Press de Banca Plano', 'chest', ARRAY['triceps', 'shoulders'], 'Barra olímpica y banco plano', 'intermediate', 'Recuéstese en el banco, sujete la barra con agarre ligeramente superior al ancho de hombros, baje controladamente al pecho y empuje verticalmente.'),
    ('Sentadilla Trasera con Barra', 'legs', ARRAY['glutes', 'core'], 'Barra olímpica y rack', 'intermediate', 'Barra sobre trapecios, pies al ancho de hombros, descender flexionando cadera y rodillas manteniendo espalda neutra hasta que los muslos estén paralelos al suelo.'),
    ('Peso Muerto Convencional', 'back', ARRAY['legs', 'glutes', 'core'], 'Barra olímpica', 'intermediate', 'Pies al ancho de cadera, agarre por fuera de las piernas, mantener columna neutra y levantar empujando el suelo con las piernas y extendiendo la cadera.'),
    ('Dominadas Pronadas', 'back', ARRAY['biceps', 'forearms'], 'Barra de dominadas', 'advanced', 'Colgarse de la barra con agarre prono, tirar con la espalda hasta que la barbilla supere la barra y descender con control.'),
    ('Press Militar de Hombros', 'shoulders', ARRAY['triceps', 'core'], 'Barra olímpica', 'intermediate', 'De pie con barra a nivel clavicular, empujar hacia arriba extendiendo los brazos y bloqueando suavemente arriba.'),
    ('Remo con Barra Inclinado', 'back', ARRAY['biceps', 'rear delts'], 'Barra olímpica', 'intermediate', 'Inclinación de tronco a 45 grados, tirar de la barra hacia la boca del estómago contrayendo los omóplatos.'),
    ('Zancadas con Mancuernas', 'legs', ARRAY['glutes'], 'Mancuernas', 'beginner', 'Dar un paso adelante flexionando ambas rodillas a 90 grados, empujar con el talón delantero para volver a la posición inicial.'),
    ('Plancha Abdominal Isométrica', 'core', ARRAY['shoulders'], 'Colchoneta', 'beginner', 'Apoyar antebrazos y puntas de pie, mantener el cuerpo completamente alineado contrayendo glúteos y abdomen.'),
    ('Flexiones de Brazos (Push-ups)', 'chest', ARRAY['triceps', 'shoulders'], 'Colchoneta', 'beginner', 'Manos ligeramente más anchas que los hombros, descender hasta rozar el suelo con el pecho y extender los brazos.'),
    ('Peso Muerto Rumano con Mancuernas', 'legs', ARRAY['glutes', 'back'], 'Mancuernas', 'intermediate', 'Ligera flexión de rodillas fija, llevar la cadera hacia atrás sintiendo el estiramiento de femorales y regresar.')
ON CONFLICT DO NOTHING;

-- 7. Widgets Preconfigurados para Analítica
INSERT INTO dashboard_widgets (name, type, query_sql, config, position_x, position_y, width, height) VALUES
    ('Clientes Activos', 'metric', 'SELECT COUNT(*) as value FROM clients WHERE status = $1', '{"label": "Socios Activos", "format": "number", "params": ["active"]}', 0, 0, 3, 2),
    ('Membresías Vigentes', 'metric', 'SELECT COUNT(*) as value FROM client_memberships WHERE status = $1 AND end_date >= CURRENT_DATE', '{"label": "Membresías Vigentes", "format": "number", "params": ["active"]}', 3, 0, 3, 2),
    ('Ingresos del Mes', 'metric', 'SELECT COALESCE(SUM(amount), 0) as value FROM payments WHERE status = $1 AND paid_at >= date_trunc($2, CURRENT_DATE)', '{"label": "Recaudación Mensual", "format": "currency", "params": ["completed", "month"]}', 6, 0, 3, 2),
    ('Vencimientos Próximos', 'metric', 'SELECT COUNT(*) as value FROM client_memberships WHERE status = $1 AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($2 || '' days'')::interval', '{"label": "Vencen en 7 Días", "format": "number", "params": ["active", "7"]}', 9, 0, 3, 2),
    ('Tendencia de Ingresos', 'line', 'SELECT date_trunc($1, paid_at) as period, SUM(amount) as value FROM payments WHERE status = $2 GROUP BY 1 ORDER BY 1', '{"xAxis": "period", "yAxis": "value", "params": ["week", "completed"]}', 0, 2, 6, 4),
    ('Distribución de Planes', 'pie', 'SELECT mp.name as label, COUNT(cm.id) as value FROM client_memberships cm JOIN membership_plans mp ON cm.plan_id = mp.id WHERE cm.status = $1 GROUP BY mp.name', '{"labelField": "label", "valueField": "value", "params": ["active"]}', 6, 2, 6, 4)
ON CONFLICT DO NOTHING;