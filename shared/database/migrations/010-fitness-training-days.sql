-- ISO weekdays (Monday = 1). NULL preserves the legacy schedule.
ALTER TABLE fitness_profiles
  ADD COLUMN IF NOT EXISTS training_days integer[];

ALTER TABLE fitness_profiles
  ADD CONSTRAINT fitness_profiles_training_days_check CHECK (
    training_days IS NULL OR (
      array_ndims(training_days) = 1
      AND array_lower(training_days, 1) = 1
      AND cardinality(training_days) = days_per_week
      AND array_position(training_days, NULL) IS NULL
      AND training_days <@ ARRAY[1, 2, 3, 4, 5, 6, 7]
      AND (days_per_week < 2 OR training_days[1] < training_days[2])
      AND (days_per_week < 3 OR training_days[2] < training_days[3])
      AND (days_per_week < 4 OR training_days[3] < training_days[4])
      AND (days_per_week < 5 OR training_days[4] < training_days[5])
      AND (days_per_week < 6 OR training_days[5] < training_days[6])
      AND (days_per_week < 7 OR training_days[6] < training_days[7])
    )
  );
