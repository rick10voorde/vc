-- Seed data for VoChat
-- Run this after applying all migrations

-- Note: Replace <USER_ID> with actual user ID after creating first user

-- Default app profiles for common use cases
-- These will be used as templates or can be copied per user

-- Example seed (uncomment after creating your first user):
/*
INSERT INTO public.app_profiles (user_id, app_key, tone, language, formatting, is_default)
VALUES
  ('<USER_ID>', 'generic', 'professional', 'en', '{"bullets": false, "max_length": 1000}'::jsonb, true),
  ('<USER_ID>', 'slack', 'direct', 'en', '{"bullets": false, "max_length": 500}'::jsonb, false),
  ('<USER_ID>', 'gmail', 'professional', 'en', '{"bullets": true, "max_length": 800}'::jsonb, false),
  ('<USER_ID>', 'docs', 'professional', 'en', '{"bullets": true, "max_length": 2000}'::jsonb, false),
  ('<USER_ID>', 'terminal', 'technical', 'en', '{"bullets": false, "max_length": 500}'::jsonb, false);
*/

-- You can run this via Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/eflhqeofkenyczflqwkz/sql
-- 2. Create a new query
-- 3. Paste seed data
-- 4. Replace <USER_ID> with your actual user UUID (from auth.users table)
-- 5. Run the query
