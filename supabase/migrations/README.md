# Supabase Migrations

This directory contains **365 real migrations** for the database schema. Migrations are applied in filename order by Supabase.

## Migration Table (Summary)

| Nr | Date | Description |
|----|------|-------------|
| 1 | 2025-01-20 | add_contact_fields_to_companies |
| 2 | 2025-01-20 | add_job_limits_to_plans |
| 3 | 2025-01-20 | fix_profile_email_sync |
| ... | ... | ... |
| 363 | 2025-01-20 | empty |
| 364 | 2025-01-20 | empty |
| 365 | 2025-01-20 | billing_v2 |

**Format:** `YYYYMMDD000001_description.sql` — sequential numbering, lowercase underscores for description.

## _archive/ Directory

The `_archive/` subdirectory contains **14 debug/test scripts** that are **never run on production**:

- `DEBUG_*`, `TEST_*`, `CHECK_*`, `MANUAL_*`, `SCHRITT_*` — diagnostic scripts
- SELECT-only queries, RAISE NOTICE, temporary checks
- Duplicate `_fixed` versions (older kept, newer archived)
- One-time fixes already applied (e.g. `disable_rls_temporarily`, `test_posts_data`)

These files are kept for git history and reference only. Do not run them in production.

**Note:** Supabase CLI runs only `.sql` files in the root of `migrations/` (not in subdirectories), so `_archive/` is never applied by `supabase db push`.

## How to Add a New Migration

1. **Create a new file** with format: `YYYYMMDD000001_short_description.sql`
   - Use today's date as `YYYYMMDD`
   - Use the next sequential number (e.g. `000366` if the last is `000365`)
   - Use lowercase with underscores for the description

2. **Example:**
   ```bash
   # Last migration is 20250120000365_billing_v2.sql
   # New file: YYYYMMDD000366_add_new_feature.sql  (use today's date)
   ```

3. **Content guidelines:**
   - Use `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `CREATE POLICY`, `INSERT` for seed data
   - Avoid SELECT-only queries (use those in `_archive/` for debugging)
   - Do not include RAISE NOTICE or temporary checks in production migrations

4. **Apply migrations:**
   ```bash
   supabase db push
   # or
   supabase migration up
   ```

## Verification

- ✅ No SELECT-only migrations in main directory
- ✅ Sequential numbering (20250120000001 through 20250120000365)
- ✅ No duplicates (older kept, newer archived)
- ✅ SQL content unchanged (only filenames and locations modified)
