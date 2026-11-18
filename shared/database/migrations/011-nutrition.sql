-- Los campos compartidos de alimentación permanecen en fitness_profiles.
CREATE TABLE nutrition_preferences (
  client_id bigint PRIMARY KEY REFERENCES clients(id),
  settings jsonb NOT NULL CHECK (jsonb_typeof(settings) = 'object')
);
-- Cada generación agrega una versión. La más reciente es el menú activo.
CREATE TABLE nutrition_menus (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id bigint NOT NULL REFERENCES clients(id),
  menu jsonb NOT NULL CHECK (jsonb_typeof(menu) = 'object'),
  bought text[] NOT NULL DEFAULT '{}',
  created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX nutrition_menus_client_history ON nutrition_menus(client_id, id DESC);
