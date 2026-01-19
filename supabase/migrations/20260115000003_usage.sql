-- 0003_usage.sql
create or replace function public.week_start(ts timestamptz)
returns timestamptz language sql immutable as $$
  select date_trunc('week', ts);
$$;

create or replace function public.get_weekly_usage(p_user uuid, p_event_type text)
returns int language sql stable as $$
  select coalesce(sum(quantity),0)::int
  from public.usage_events
  where user_id = p_user
    and event_type = p_event_type
    and created_at >= public.week_start(now());
$$;
