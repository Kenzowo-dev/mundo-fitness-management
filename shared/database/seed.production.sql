-- Production starts with roles only. Create the first administrator privately.
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'Acceso total y administración del sistema', '["*"]'),
    ('receptionist', 'Gestión de clientes, cobros, accesos y membresías', '["clients:read", "clients:write", "memberships:read", "memberships:write", "payments:read", "payments:write"]'),
    ('member', 'Acceso perfil, membresías y pagos propios', '["profile:read", "profile:write", "memberships:read", "payments:read"]')
ON CONFLICT (name) DO NOTHING;
