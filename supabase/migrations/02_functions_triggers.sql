-- =====================================================================
-- 02_functions_triggers.sql
-- Helper functions, permission enforcement, computed values
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger trg_bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

create trigger trg_printing_updated_at before update on booking_printing
  for each row execute function set_updated_at();

create trigger trg_user_permissions_updated_at before update on user_permissions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- is_admin()
-- ---------------------------------------------------------------------
create or replace function is_admin(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from profiles where id = p_user and status = 'active'),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- has_action_permission(action)
-- action in: 'view','create','edit','delete','change_status','add_notes'
-- ---------------------------------------------------------------------
create or replace function has_action_permission(p_action text, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select case p_action
    when 'view'          then coalesce((select can_view_bookings   from user_permissions where user_id = p_user), false)
    when 'create'        then coalesce((select can_create_booking  from user_permissions where user_id = p_user), false)
    when 'edit'          then coalesce((select can_edit_booking    from user_permissions where user_id = p_user), false)
    when 'delete'        then coalesce((select can_delete_booking  from user_permissions where user_id = p_user), false)
    when 'change_status' then coalesce((select can_change_status   from user_permissions where user_id = p_user), false)
    when 'add_notes'     then coalesce((select can_add_notes       from user_permissions where user_id = p_user), false)
    else false
  end
  or is_admin(p_user);
$$;

-- ---------------------------------------------------------------------
-- can_access_booking(booking_id) — implements scope rules (section 5)
-- ---------------------------------------------------------------------
create or replace function can_access_booking(p_booking_id uuid, p_user uuid default auth.uid())
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_scope booking_access_scope;
begin
  if is_admin(p_user) then
    return true;
  end if;

  select booking_scope into v_scope from user_permissions where user_id = p_user;

  if v_scope is null then
    return false;
  elsif v_scope = 'all' then
    return true;
  elsif v_scope = 'assigned_only' then
    return exists (
      select 1 from booking_assignees
      where booking_id = p_booking_id and user_id = p_user
    );
  elsif v_scope = 'selected' then
    return exists (
      select 1 from user_selected_bookings
      where booking_id = p_booking_id and user_id = p_user
    );
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------
-- field_can_view / field_can_edit
-- ---------------------------------------------------------------------
create or replace function field_can_view(p_field text, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin(p_user) or coalesce(
    (select can_view from user_field_permissions where user_id = p_user and field_name = p_field),
    false
  );
$$;

create or replace function field_can_edit(p_field text, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin(p_user) or coalesce(
    (select can_edit from user_field_permissions where user_id = p_user and field_name = p_field),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- Enforce field-level EDIT permissions on bookings (section 6)
-- Postgres RLS is row-level only, so column-level "who can edit what"
-- is enforced here with a BEFORE UPDATE trigger that compares OLD/NEW.
-- ---------------------------------------------------------------------
create or replace function enforce_booking_field_edit_permissions()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin(auth.uid()) then
    return new;
  end if;

  if (new.customer_name is distinct from old.customer_name)
     and not field_can_edit('customer_name') then
    raise exception 'Not permitted to edit customer_name';
  end if;

  if (new.customer_phone is distinct from old.customer_phone
      or new.customer_whatsapp is distinct from old.customer_whatsapp)
     and not field_can_edit('customer_phone') then
    raise exception 'Not permitted to edit customer_phone';
  end if;

  if (new.booking_types is distinct from old.booking_types
      or new.other_type_text is distinct from old.other_type_text)
     and not field_can_edit('booking_type') then
    raise exception 'Not permitted to edit booking_type';
  end if;

  if (new.booking_date is distinct from old.booking_date)
     and not field_can_edit('booking_date') then
    raise exception 'Not permitted to edit booking_date';
  end if;

  if (new.start_time is distinct from old.start_time
      or new.end_time is distinct from old.end_time)
     and not field_can_edit('time') then
    raise exception 'Not permitted to edit time';
  end if;

  if (new.location is distinct from old.location
      or new.location_url is distinct from old.location_url)
     and not field_can_edit('location') then
    raise exception 'Not permitted to edit location';
  end if;

  if (new.price is distinct from old.price)
     and not field_can_edit('price') then
    raise exception 'Not permitted to edit price';
  end if;

  if (new.deposit_paid is distinct from old.deposit_paid
      or new.deposit_amount is distinct from old.deposit_amount)
     and not field_can_edit('deposit') then
    raise exception 'Not permitted to edit deposit';
  end if;

  if (new.notes is distinct from old.notes) then
    if not (field_can_edit('notes') or has_action_permission('add_notes')) then
      raise exception 'Not permitted to edit notes';
    end if;
  end if;

  if (new.status is distinct from old.status)
     and not has_action_permission('change_status') then
    raise exception 'Not permitted to change status';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_booking_field_edit
  before update on bookings
  for each row execute function enforce_booking_field_edit_permissions();

-- Same idea for the printing sub-table, gated on the 'printing' field.
create or replace function enforce_printing_field_edit_permissions()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin(auth.uid()) then
    return new;
  end if;

  if not field_can_edit('printing') then
    raise exception 'Not permitted to edit printing';
  end if;

  if not can_access_booking(new.booking_id) then
    raise exception 'Not permitted to access this booking';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_printing_field_edit
  before insert or update on booking_printing
  for each row execute function enforce_printing_field_edit_permissions();

-- ---------------------------------------------------------------------
-- Compute remind_at for booking_reminders (uses booking date/start_time,
-- or custom_datetime directly).
-- ---------------------------------------------------------------------
create or replace function compute_reminder_remind_at()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_booking_dt timestamptz;
begin
  if new.reminder_type = 'custom' then
    new.remind_at := new.custom_datetime;
    return new;
  end if;

  select (b.booking_date + coalesce(b.start_time, '00:00'::time))::timestamptz
    into v_booking_dt
  from bookings b
  where b.id = new.booking_id;

  new.remind_at := v_booking_dt - (case new.reminder_type
    when '1h'  then interval '1 hour'
    when '2h'  then interval '2 hours'
    when '3h'  then interval '3 hours'
    when '6h'  then interval '6 hours'
    when '12h' then interval '12 hours'
    when '1d'  then interval '1 day'
    else interval '0'
  end);

  return new;
end;
$$;

create trigger trg_compute_remind_at
  before insert or update of reminder_type, custom_datetime, booking_id
  on booking_reminders
  for each row execute function compute_reminder_remind_at();

-- If the booking's date/time changes, recompute remind_at for any
-- non-custom, unsent reminders attached to it.
create or replace function recompute_reminders_on_booking_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.booking_date is distinct from old.booking_date)
     or (new.start_time is distinct from old.start_time) then
    update booking_reminders
       set remind_at = (new.booking_date + coalesce(new.start_time, '00:00'::time))::timestamptz
           - (case reminder_type
               when '1h'  then interval '1 hour'
               when '2h'  then interval '2 hours'
               when '3h'  then interval '3 hours'
               when '6h'  then interval '6 hours'
               when '12h' then interval '12 hours'
               when '1d'  then interval '1 day'
               else interval '0'
             end)
     where booking_id = new.id
       and reminder_type <> 'custom'
       and sent = false;
  end if;
  return new;
end;
$$;

create trigger trg_recompute_reminders
  after update of booking_date, start_time on bookings
  for each row execute function recompute_reminders_on_booking_change();

-- ---------------------------------------------------------------------
-- get_booking_json(booking_id) — field-filtered read (section 6 example)
-- Client should call this RPC instead of selecting raw columns whenever
-- field-level visibility must be respected (admins can also just query
-- the table directly since RLS + this function both allow full access).
-- ---------------------------------------------------------------------
create or replace function get_booking_json(p_booking_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row bookings%rowtype;
  v_printing booking_printing%rowtype;
  v_result jsonb := '{}'::jsonb;
begin
  if not can_access_booking(p_booking_id, v_uid) or not has_action_permission('view', v_uid) then
    raise exception 'Not permitted to view this booking';
  end if;

  select * into v_row from bookings where id = p_booking_id;
  select * into v_printing from booking_printing where booking_id = p_booking_id;

  v_result := v_result || jsonb_build_object('id', v_row.id, 'status', v_row.status);

  if field_can_view('customer_name', v_uid) then
    v_result := v_result || jsonb_build_object('customer_name', v_row.customer_name);
  end if;
  if field_can_view('customer_phone', v_uid) then
    v_result := v_result || jsonb_build_object(
      'customer_phone', v_row.customer_phone,
      'customer_whatsapp', v_row.customer_whatsapp
    );
  end if;
  if field_can_view('booking_type', v_uid) then
    v_result := v_result || jsonb_build_object(
      'booking_types', v_row.booking_types,
      'other_type_text', v_row.other_type_text
    );
  end if;
  if field_can_view('booking_date', v_uid) then
    v_result := v_result || jsonb_build_object('booking_date', v_row.booking_date);
  end if;
  if field_can_view('time', v_uid) then
    v_result := v_result || jsonb_build_object('start_time', v_row.start_time, 'end_time', v_row.end_time);
  end if;
  if field_can_view('location', v_uid) then
    v_result := v_result || jsonb_build_object('location', v_row.location, 'location_url', v_row.location_url);
  end if;
  if field_can_view('price', v_uid) then
    v_result := v_result || jsonb_build_object('price', v_row.price);
  end if;
  if field_can_view('deposit', v_uid) then
    v_result := v_result || jsonb_build_object(
      'deposit_paid', v_row.deposit_paid,
      'deposit_amount', v_row.deposit_amount,
      'payment_status', v_row.payment_status
    );
  end if;
  if field_can_view('remaining', v_uid) then
    v_result := v_result || jsonb_build_object('remaining_amount', v_row.remaining_amount);
  end if;
  if field_can_view('printing', v_uid) and v_printing.booking_id is not null then
    v_result := v_result || jsonb_build_object('printing', to_jsonb(v_printing) - 'booking_id');
  end if;
  if field_can_view('notes', v_uid) then
    v_result := v_result || jsonb_build_object('notes', v_row.notes);
  end if;
  if field_can_view('reminder', v_uid) then
    v_result := v_result || jsonb_build_object(
      'reminders', (
        select coalesce(jsonb_agg(to_jsonb(r) - 'booking_id'), '[]'::jsonb)
        from booking_reminders r where r.booking_id = p_booking_id
      )
    );
  end if;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- list_visible_bookings() — convenience RPC returning ids the caller
-- may see, useful for building the bookings list screen.
-- ---------------------------------------------------------------------
create or replace function list_visible_bookings()
returns setof bookings
language sql stable security definer set search_path = public as $$
  select b.* from bookings b
  where has_action_permission('view')
    and can_access_booking(b.id);
$$;
