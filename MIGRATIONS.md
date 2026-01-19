# How to Apply Migrations

## Quick Method (Recommended)

1. **Open Supabase SQL Editor**

   Go to: https://supabase.com/dashboard/project/eflhqeofkenyczflqwkz/sql/new

2. **Copy & Run Each Migration**

   **Migration 1 - Initial Schema:**
   - Open: `supabase/migrations/20260115000001_init.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

   **Migration 2 - Row Level Security:**
   - Open: `supabase/migrations/20260115000002_rls.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

   **Migration 3 - Usage Functions:**
   - Open: `supabase/migrations/20260115000003_usage.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify**

   Run this query to verify all tables exist:

   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_type = 'BASE TABLE'
   ORDER BY table_name;
   ```

   Expected tables:
   - app_profiles
   - dictation_sessions
   - dictionary_terms
   - snippets
   - stripe_customers
   - stripe_subscriptions
   - usage_events
   - user_settings
   - workflows

## Done!

Once migrations are applied, you're ready for Phase 2: Next.js web app with authentication.
