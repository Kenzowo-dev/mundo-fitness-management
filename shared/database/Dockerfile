FROM postgres:17-alpine

ARG DB_SEED_FILE=seed.sql

COPY shared/database/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY shared/database/${DB_SEED_FILE} /docker-entrypoint-initdb.d/02-seed.sql
COPY shared/database/migrations/003-membership-renewal-requests.sql /docker-entrypoint-initdb.d/03-membership-renewal-requests.sql
