-- Fechas reales de entrenamiento.
--
-- completed_at: instante en que se guardo el registro.
-- performed_on: fecha que indica el cliente como realizada.
--
-- Los registros anteriores permanecen intactos.
-- performed_on es nullable para conservar compatibilidad.

ALTER TABLE fitness_workout_logs
ADD COLUMN IF NOT EXISTS performed_on DATE;

-- Evitar duplicados accidentales de una misma sesion
-- en una misma fecha.
-- Los registros historicos con performed_on NULL
-- no se ven afectados.

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_fitness_logs_unique_session_date
ON fitness_workout_logs (
    session_id,
    performed_on
)
WHERE performed_on IS NOT NULL;

-- Facilitar consultas por fecha realizada.

CREATE INDEX IF NOT EXISTS
    idx_fitness_logs_client_performed
ON fitness_workout_logs (
    client_id,
    performed_on DESC
)
WHERE performed_on IS NOT NULL;

COMMENT ON COLUMN fitness_workout_logs.performed_on IS
'Fecha local en que el socio declara haber realizado el entrenamiento.';
