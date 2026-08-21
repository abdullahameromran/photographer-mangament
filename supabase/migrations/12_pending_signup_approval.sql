-- Surface self-service signups to the platform administrator and approve them safely.
create or replace function public.list_pending_signups()
returns table (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  return query
  select u.id, coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1)),
         coalesce(u.email, ''), coalesce(p.phone, ''), u.created_at
  from auth.users u
  join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id
  where s.user_id is null
    and not exists (select 1 from public.super_admins sa where sa.user_id = u.id)
  order by u.created_at desc;
end;
$$;

create or replace function public.approve_signup(
  p_user uuid,
  p_plan text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires timestamptz;
  v_studio uuid;
  v_name text;
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if p_plan not in ('trial', 'monthly', 'quarterly', 'yearly') then
    raise exception 'Invalid subscription plan';
  end if;

  v_expires := case p_plan
    when 'trial' then now() + interval '7 days'
    when 'monthly' then now() + interval '1 month'
    when 'quarterly' then now() + interval '3 months'
    when 'yearly' then now() + interval '1 year'
  end;

  select studio_id, full_name into v_studio, v_name
  from public.profiles where id = p_user;
  if not found then raise exception 'Account not found'; end if;

  if v_studio is null then
    insert into public.studios(name, owner_id)
    values (coalesce(nullif(v_name, ''), 'Studio') || ' Studio', p_user)
    returning id into v_studio;
  end if;

  update public.profiles
  set studio_id = v_studio, is_admin = true, job_title = 'Owner', status = 'active'
  where id = p_user;

  insert into public.subscriptions(user_id, plan_code, starts_at, expires_at, enabled)
  values (p_user, p_plan, now(), v_expires, true)
  on conflict (user_id) do update set
    plan_code = excluded.plan_code,
    starts_at = excluded.starts_at,
    expires_at = excluded.expires_at,
    enabled = true,
    updated_at = now();

  update public.user_permissions set
    can_view_bookings = true, can_create_booking = true, can_edit_booking = true,
    can_delete_booking = true, can_change_status = true, can_add_notes = true,
    booking_scope = 'all'
  where user_id = p_user;
  update public.user_field_permissions
  set can_view = true, can_edit = true where user_id = p_user;
end;
$$;

revoke all on function public.list_pending_signups() from public;
revoke all on function public.approve_signup(uuid, text) from public;
grant execute on function public.list_pending_signups() to authenticated;
grant execute on function public.approve_signup(uuid, text) to authenticated;
