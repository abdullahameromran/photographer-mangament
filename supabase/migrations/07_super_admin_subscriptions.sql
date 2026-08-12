-- Platform-level subscriber management. Run after 06_auth_profiles.sql.
alter table public.profiles add column if not exists phone text;
create table if not exists public.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan_code text not null check (plan_code in ('monthly','quarterly','yearly')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_dates_valid check (expires_at > starts_at)
);

create or replace function public.is_super_admin(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.super_admins where user_id=p_user);
$$;

alter table public.super_admins enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists super_admins_self_read on public.super_admins;
create policy super_admins_self_read on public.super_admins for select using (user_id=auth.uid());
drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions for select using (user_id=auth.uid() or public.is_super_admin());
drop policy if exists subscriptions_super_admin_insert on public.subscriptions;
create policy subscriptions_super_admin_insert on public.subscriptions for insert with check (public.is_super_admin());
drop policy if exists subscriptions_super_admin_update on public.subscriptions;
create policy subscriptions_super_admin_update on public.subscriptions for update using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists subscriptions_super_admin_delete on public.subscriptions;
create policy subscriptions_super_admin_delete on public.subscriptions for delete using (public.is_super_admin());
drop policy if exists profiles_super_admin_select on public.profiles;
create policy profiles_super_admin_select on public.profiles for select using (public.is_super_admin());

-- IMPORTANT: promote your platform-owner account once, replacing the email:
-- insert into public.super_admins(user_id)
-- select id from auth.users where email='YOUR_SUPER_ADMIN_EMAIL'
-- on conflict do nothing;
