
-- Fotografía de perfil del socio
-- Mundo Fitness Management

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN clients.avatar_url IS
'Referencia a la fotografía de perfil del cliente';