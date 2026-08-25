-- Migration history marker for the TV catalog seed applied to production.
--
-- The canonical catalog is intentionally kept in application source and seeded
-- by scripts/seed-tv-catalog.mjs (`npm run seed:tv`). Keeping the 86-channel
-- catalog out of schema migrations avoids duplicating a fast-changing content
-- list in SQL while preserving the exact Supabase migration version applied to
-- production (20260825120533).
--
-- New environments should run migrations first, then `npm run seed:tv` with a
-- service-role key to populate/update the TV catalog idempotently.

select 1;
