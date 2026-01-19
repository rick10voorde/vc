-- 0002_rls.sql
alter table public.user_settings enable row level security;
alter table public.app_profiles enable row level security;
alter table public.dictionary_terms enable row level security;
alter table public.snippets enable row level security;
alter table public.workflows enable row level security;
alter table public.dictation_sessions enable row level security;
alter table public.usage_events enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.stripe_subscriptions enable row level security;

-- user_settings
create policy "select own user_settings"
on public.user_settings for select
using (user_id = auth.uid());

create policy "upsert own user_settings"
on public.user_settings for insert
with check (user_id = auth.uid());

create policy "update own user_settings"
on public.user_settings for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- app_profiles
create policy "crud own app_profiles"
on public.app_profiles
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- dictionary_terms
create policy "crud own dictionary_terms"
on public.dictionary_terms
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- snippets
create policy "crud own snippets"
on public.snippets
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- workflows
create policy "crud own workflows"
on public.workflows
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- dictation_sessions (own only)
create policy "crud own dictation_sessions"
on public.dictation_sessions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- usage_events (insert by server only? MVP: allow user insert, later restrict)
create policy "select own usage_events"
on public.usage_events for select
using (user_id = auth.uid());

create policy "insert own usage_events"
on public.usage_events for insert
with check (user_id = auth.uid());

-- stripe tables: readable by user, write by server (MVP: allow select only)
create policy "select own stripe_customers"
on public.stripe_customers for select
using (user_id = auth.uid());

create policy "select own stripe_subscriptions"
on public.stripe_subscriptions for select
using (user_id = auth.uid());
