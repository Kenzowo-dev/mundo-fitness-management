-- Mundo Fitness Management
-- Migración 008: preferencias avanzadas del recomendador.
-- Amplía fitness_profiles sin eliminar los perfiles existentes.

ALTER TABLE fitness_profiles
    ADD COLUMN IF NOT EXISTS preferred_exercise_types JSONB
        NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS avoided_exercise_ids JSONB
        NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS preferred_intensity VARCHAR(20)
        NOT NULL DEFAULT 'moderate',
    ADD COLUMN IF NOT EXISTS dietary_preferences JSONB
        NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS disliked_ingredients JSONB
        NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS food_allergies JSONB
        NOT NULL DEFAULT '[]'::jsonb;

-- Validar que las preferencias sean arreglos JSON.
ALTER TABLE fitness_profiles
    ADD CONSTRAINT fitness_profiles_exercise_types_array
        CHECK (jsonb_typeof(preferred_exercise_types) = 'array'),
    ADD CONSTRAINT fitness_profiles_avoided_exercises_array
        CHECK (jsonb_typeof(avoided_exercise_ids) = 'array'),
    ADD CONSTRAINT fitness_profiles_dietary_preferences_array
        CHECK (jsonb_typeof(dietary_preferences) = 'array'),
    ADD CONSTRAINT fitness_profiles_disliked_ingredients_array
        CHECK (jsonb_typeof(disliked_ingredients) = 'array'),
    ADD CONSTRAINT fitness_profiles_food_allergies_array
        CHECK (jsonb_typeof(food_allergies) = 'array');

-- Intensidades permitidas.
ALTER TABLE fitness_profiles
    ADD CONSTRAINT fitness_profiles_preferred_intensity_check
        CHECK (
            preferred_intensity IN (
                'light',
                'moderate',
                'intense'
            )
        );
