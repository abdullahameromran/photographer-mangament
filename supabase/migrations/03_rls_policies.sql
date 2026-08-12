-- =====================================================================
-- 03_rls_policies.sql
-- Row Level Security — row-level access (scope). Field-level edit is
-- already enforced by triggers in 02_functions_triggers.sql; field-level
-- read is enforced by the get_booking_json() RPC at the application layer.
-- =====================================================================

alter table profiles enable row level security;
alter table bookings enable row level security;
alter table booking_printing enable row level security;
alter table booking_reminders enable row level security;
alter table booking_assignees enable row level security;
alter table user_permissions enable row level security;
alter table user_selected_bookings enable row level security;
alter table user_field_permissions enable row level security;
alter table field_catalog enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy profiles_select on profiles
  for select using (is_admin() or id = auth.uid());

create policy profiles_admin_write on profiles
  for insert with check (is_admin());
create policy profiles_admin_update on profiles
  for update using (is_admin() or id = auth.uid())
             with check (is_admin() or id = auth.uid());
-- Non-admins may update their own row but never their own is_admin/status;
-- enforced with a trigger since RLS can't diff specific columns.
create or replace function prevent_self_privilege_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    if new.is_admin is distinct from old.is_admin or new.status is distinct from old.status then
      raise exception 'Not permitted to change admin flag or status';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_prevent_self_privilege_escalation
  before update on profiles
  for each row execute function prevent_self_privilege_escalation();

create policy profiles_admin_delete on profiles
  for delete using (is_admin());

-- ---------------------------------------------------------------------
-- field_catalog — read-only reference data, visible to any authenticated user
-- ---------------------------------------------------------------------
create policy field_catalog_select on field_catalog
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create policy bookings_select on bookings
  for select using (
    is_admin() or (has_action_permission('view') and can_access_booking(id))
  );

create policy bookings_insert on bookings
  for insert with check (
    is_admin() or has_action_permission('create')
  );

create policy bookings_update on bookings
  for update using (
    is_admin() or (has_action_permission('edit') and can_access_booking(id))
  )
  with check (
    is_admin() or (has_action_permission('edit') and can_access_booking(id))
  );

create policy bookings_delete on bookings
  for delete using (
    is_admin() or (has_action_permission('delete') and can_access_booking(id))
  );

-- ---------------------------------------------------------------------
-- booking_printing (follows access to the parent booking)
-- ---------------------------------------------------------------------
create policy printing_select on booking_printing
  for select using (
    is_admin() or (
      has_action_permission('view')
      and can_access_booking(booking_id)
      and field_can_view('printing')
    )
  );

create policy printing_write on booking_printing
  for insert with check (is_admin() or (can_access_booking(booking_id) and field_can_edit('printing')));

create policy printing_update on booking_printing
  for update using (is_admin() or (can_access_booking(booking_id) and field_can_edit('printing')))
  with check (is_admin() or (can_access_booking(booking_id) and field_can_edit('printing')));

create policy printing_delete on booking_printing
  for delete using (is_admin());

-- ---------------------------------------------------------------------
-- booking_reminders
-- ---------------------------------------------------------------------
create policy reminders_select on booking_reminders
  for select using (
    is_admin() or (can_access_booking(booking_id) and field_can_view('reminder'))
  );

create policy reminders_write on booking_reminders
  for insert with check (is_admin() or (can_access_booking(booking_id) and field_can_edit('reminder')));

create policy reminders_update on booking_reminders
  for update using (is_admin() or (can_access_booking(booking_id) and field_can_edit('reminder')))
  with check (is_admin() or (can_access_booking(booking_id) and field_can_edit('reminder')));

create policy reminders_delete on booking_reminders
  for delete using (is_admin() or (can_access_booking(booking_id) and field_can_edit('reminder')));

-- ---------------------------------------------------------------------
-- booking_assignees — only admin manages who's assigned;
-- assigned users can see their own assignment rows.
-- ---------------------------------------------------------------------
create policy assignees_select on booking_assignees
  for select using (is_admin() or user_id = auth.uid());

create policy assignees_admin_write on booking_assignees
  for insert with check (is_admin());
create policy assignees_admin_delete on booking_assignees
  for delete using (is_admin());

-- ---------------------------------------------------------------------
-- user_permissions — admin manages everything; a user can read their own row
-- ---------------------------------------------------------------------
create policy user_permissions_select on user_permissions
  for select using (is_admin() or user_id = auth.uid());

create policy user_permissions_admin_write on user_permissions
  for insert with check (is_admin());
create policy user_permissions_admin_update on user_permissions
  for update using (is_admin()) with check (is_admin());
create policy user_permissions_admin_delete on user_permissions
  for delete using (is_admin());

-- ---------------------------------------------------------------------
-- user_selected_bookings — admin manages; user can read their own list
-- ---------------------------------------------------------------------
create policy selected_bookings_select on user_selected_bookings
  for select using (is_admin() or user_id = auth.uid());

create policy selected_bookings_admin_write on user_selected_bookings
  for insert with check (is_admin());
create policy selected_bookings_admin_delete on user_selected_bookings
  for delete using (is_admin());

-- ---------------------------------------------------------------------
-- user_field_permissions — admin manages; user can read their own grants
-- ---------------------------------------------------------------------
create policy field_permissions_select on user_field_permissions
  for select using (is_admin() or user_id = auth.uid());

create policy field_permissions_admin_write on user_field_permissions
  for insert with check (is_admin());
create policy field_permissions_admin_update on user_field_permissions
  for update using (is_admin()) with check (is_admin());
create policy field_permissions_admin_delete on user_field_permissions
  for delete using (is_admin());
