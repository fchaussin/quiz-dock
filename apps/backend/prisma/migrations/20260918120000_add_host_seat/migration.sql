-- Local mode host seat: a single row (id = 1) naming the local user who holds
-- the host role, with an optional expiry. Additive, no data migration.
CREATE TABLE "host_seat" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "user_id" CHAR(26) NOT NULL,
    "claimed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "host_seat_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "host_seat_singleton_check" CHECK ("id" = 1)
);

CREATE UNIQUE INDEX "host_seat_user_id_key" ON "host_seat"("user_id");

ALTER TABLE "host_seat" ADD CONSTRAINT "host_seat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
