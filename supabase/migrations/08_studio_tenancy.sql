-- Isolate every subscriber in a private studio workspace.
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists studio_id uuid references public.studios(id) on delete cascade;
alter table public.bookings add column if not exists studio_id uuid references public.studios(id) on delete cascade;
create index if not exists idx_profiles_studio on public.profiles(studio_id);
create index if not exists idx_bookings_studio on public.bookings(studio_id);

create or replace function public.current_studio_id(p_user uuid default auth.uid())
returns uuid language sql stable security definer set search_path=public as $$
  select studio_id from public.profiles where id=p_user;
$$;

create or replace function public.in_current_studio(p_studio uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select p_studio is not null and p_studio=public.current_studio_id(p_user);
$$;

-- Replace the older guard so trusted SQL/service-role operations can provision
-- studio owners, while normal users still cannot promote themselves.
create or replace function public.prevent_self_privilege_escalation()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if current_user in ('postgres','service_role')
     or auth.role()='service_role'
     or public.is_super_admin(auth.uid()) then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.status is distinct from old.status
     or new.studio_id is distinct from old.studio_id then
    raise exception 'Not permitted to change admin flag, status, or studio';
  end if;
  return new;
end;
$$;

-- Existing accounts without a workspace receive their own isolated studio.
do $$ declare account record; new_studio uuid; begin
  for account in select id,full_name from public.profiles where studio_id is null loop
    insert into public.studios(name,owner_id) values(account.full_name || ' Studio',account.id) returning id into new_studio;
    update public.profiles set studio_id=new_studio where id=account.id;
    update public.bookings set studio_id=new_studio where created_by=account.id and studio_id is null;
  end loop;
end $$;

create or replace function public.set_booking_studio()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.studio_id is null then new.studio_id:=public.current_studio_id(coalesce(new.created_by,auth.uid())); end if;
  if new.created_by is null then new.created_by:=auth.uid(); end if;
  return new;
end $$;
drop trigger if exists trg_set_booking_studio on public.bookings;
create trigger trg_set_booking_studio before insert on public.bookings for each row execute function public.set_booking_studio();

alter table public.studios enable row level security;
drop policy if exists studios_member_read on public.studios;
create policy studios_member_read on public.studios for select using(id=public.current_studio_id() or public.is_super_admin());

-- Replace broad admin policies with studio-scoped policies.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using(public.is_super_admin() or id=auth.uid() or studio_id=public.current_studio_id());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update using(public.is_super_admin() or id=auth.uid() or (public.is_admin() and studio_id=public.current_studio_id())) with check(public.is_super_admin() or id=auth.uid() or studio_id=public.current_studio_id());

drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select using(public.in_current_studio(studio_id) and (public.is_admin() or (public.has_action_permission('view') and public.can_access_booking(id))));
drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings for insert with check(public.in_current_studio(studio_id) and (public.is_admin() or public.has_action_permission('create')));
drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings for update using(public.in_current_studio(studio_id) and (public.is_admin() or (public.has_action_permission('edit') and public.can_access_booking(id)))) with check(public.in_current_studio(studio_id));
drop policy if exists bookings_delete on public.bookings;
create policy bookings_delete on public.bookings for delete using(public.in_current_studio(studio_id) and (public.is_admin() or (public.has_action_permission('delete') and public.can_access_booking(id))));

drop policy if exists user_permissions_select on public.user_permissions;
create policy user_permissions_select on public.user_permissions for select using(public.is_super_admin() or user_id=auth.uid() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));
drop policy if exists user_permissions_admin_write on public.user_permissions;
create policy user_permissions_admin_write on public.user_permissions for insert with check(public.is_super_admin() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));
drop policy if exists user_permissions_admin_update on public.user_permissions;
create policy user_permissions_admin_update on public.user_permissions for update using(public.is_super_admin() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id()))) with check(public.is_super_admin() or exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id()));
drop policy if exists user_permissions_admin_delete on public.user_permissions;
create policy user_permissions_admin_delete on public.user_permissions for delete using(public.is_super_admin() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));

drop policy if exists field_permissions_select on public.user_field_permissions;
create policy field_permissions_select on public.user_field_permissions for select using(public.is_super_admin() or user_id=auth.uid() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));
drop policy if exists field_permissions_admin_write on public.user_field_permissions;
create policy field_permissions_admin_write on public.user_field_permissions for insert with check(public.is_super_admin() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));
drop policy if exists field_permissions_admin_update on public.user_field_permissions;
create policy field_permissions_admin_update on public.user_field_permissions for update using(public.is_super_admin() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id()))) with check(public.is_super_admin() or exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id()));
drop policy if exists field_permissions_admin_delete on public.user_field_permissions;
create policy field_permissions_admin_delete on public.user_field_permissions for delete using(public.is_super_admin() or (public.is_admin() and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));

drop policy if exists assignees_admin_write on public.booking_assignees;
create policy assignees_admin_write on public.booking_assignees for insert with check(public.is_super_admin() or (public.is_admin() and public.can_access_booking(booking_id) and exists(select 1 from profiles p where p.id=user_id and p.studio_id=public.current_studio_id())));
drop policy if exists assignees_admin_delete on public.booking_assignees;
create policy assignees_admin_delete on public.booking_assignees for delete using(public.is_super_admin() or (public.is_admin() and public.can_access_booking(booking_id)));

create or replace function public.can_access_booking(p_booking_id uuid,p_user uuid default auth.uid())
returns boolean language plpgsql stable security definer set search_path=public as $$
declare v_scope booking_access_scope; v_studio uuid; begin
  select studio_id into v_studio from bookings where id=p_booking_id;
  if v_studio is null or v_studio<>current_studio_id(p_user) then return false; end if;
  if is_admin(p_user) then return true; end if;
  select booking_scope into v_scope from user_permissions where user_id=p_user;
  if v_scope='all' then return true;
  elsif v_scope='assigned_only' then return exists(select 1 from booking_assignees where booking_id=p_booking_id and user_id=p_user);
  elsif v_scope='selected' then return exists(select 1 from user_selected_bookings where booking_id=p_booking_id and user_id=p_user);
  end if; return false;
end $$;

-- Existing subscriber owners become full admins of their private workspace.
update public.profiles p set is_admin=true,job_title='Owner',status='active'
where exists(select 1 from public.subscriptions s where s.user_id=p.id);
update public.user_permissions up set can_view_bookings=true,can_create_booking=true,can_edit_booking=true,can_delete_booking=true,can_change_status=true,can_add_notes=true,booking_scope='all'
where exists(select 1 from public.subscriptions s where s.user_id=up.user_id);
update public.user_field_permissions fp set can_view=true,can_edit=true
where exists(select 1 from public.subscriptions s where s.user_id=fp.user_id);
