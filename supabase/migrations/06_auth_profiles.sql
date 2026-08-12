-- Create the application profile and safe defaults whenever a user signs up.
-- The first account created in a fresh project becomes the administrator.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_is_first boolean;
begin
  select not exists(select 1 from public.profiles) into v_is_first;
  insert into public.profiles (id, full_name, job_title, is_admin, status)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)), case when v_is_first then 'Owner' else 'Member' end, v_is_first, 'active');

  insert into public.user_permissions (user_id, can_view_bookings, can_create_booking, can_edit_booking, can_delete_booking, can_change_status, can_add_notes, booking_scope)
  values (
    new.id,
    true,
    v_is_first,
    v_is_first,
    v_is_first,
    v_is_first,
    v_is_first,
    case
      when v_is_first then 'all'::booking_access_scope
      else 'assigned_only'::booking_access_scope
    end
  );

  insert into public.user_field_permissions (user_id, field_name, can_view, can_edit)
  select new.id, field_name, true, v_is_first from public.field_catalog;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill accounts that were created before this trigger was installed.
-- The oldest account becomes the owner when the project has no admin yet.
do $$
declare
  account record;
  account_is_admin boolean;
begin
  for account in
    select u.id, u.email, u.raw_user_meta_data, u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null
    order by u.created_at asc
  loop
    select not exists(select 1 from public.profiles where is_admin = true)
      into account_is_admin;

    insert into public.profiles (id, full_name, job_title, is_admin, status)
    values (
      account.id,
      coalesce(nullif(account.raw_user_meta_data->>'full_name', ''), split_part(account.email, '@', 1)),
      case when account_is_admin then 'Owner' else 'Member' end,
      account_is_admin,
      'active'
    )
    on conflict (id) do nothing;

    insert into public.user_permissions (
      user_id, can_view_bookings, can_create_booking, can_edit_booking,
      can_delete_booking, can_change_status, can_add_notes, booking_scope
    ) values (
      account.id, true, account_is_admin, account_is_admin,
      account_is_admin, account_is_admin, account_is_admin,
      case
        when account_is_admin then 'all'::booking_access_scope
        else 'assigned_only'::booking_access_scope
      end
    ) on conflict (user_id) do nothing;

    insert into public.user_field_permissions (user_id, field_name, can_view, can_edit)
    select account.id, field_name, true, account_is_admin
    from public.field_catalog
    on conflict (user_id, field_name) do nothing;
  end loop;
end;
$$;
