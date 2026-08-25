# Supabase migration baseline

Production project: `BarDosAmigos` (`vecslxbrfcdvdefarnbd`).

On 2026-08-25, production already contained the schema represented by the migration files in `supabase/migrations`, but `supabase_migrations.schema_migrations` was empty because historical changes had been applied manually through the Dashboard/SQL Editor.

To prevent a future `supabase db push` from re-running historical migrations, the remote migration history was reconciled by marking the existing migration timestamps as already applied **without executing their SQL again**.

Baseline versions:

- `20260619000100` — initial_platform_schema
- `20260619000200` — storage_buckets
- `20260622000100` — create_missing_platform_tables
- `20260622000200` — add_brazil_time_fields_to_matches
- `20260622000300` — add_premium_sports_fields
- `20260623000100` — add_football_favorites
- `20260623000200` — deduplicate_football_data
- `20260627000100` — create_layout_settings
- `20260627000200` — layout_settings_runtime_states
- `20260708000100` — tv_platform_core
- `20260709000100` — tv_manager_constraints
- `20260714000100` — create_radio_music_requests
- `20260721000100` — harden_public_rls
- `20260824000100` — profile_self_management
- `20260824000200` — harden_competition_admin_access
- `20260824000300` — align_competition_rls_with_production

## Rule going forward

Do not make production schema changes directly in the Supabase Dashboard/SQL Editor. Create a migration file first, review it, apply it through the migration workflow, and keep Git and `supabase_migrations.schema_migrations` synchronized.

If production history and local migration files diverge again, use Supabase migration repair semantics: mark a migration as applied/reverted only after verifying that the real schema state matches the intended migration state.
