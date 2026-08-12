-- =====================================================================
-- 05_seed_example.sql
-- Example matching section 6/8 of the spec: an assistant ("Ahmed") who
-- can only see his assigned bookings and a restricted set of fields.
-- Replace the UUIDs with real auth.users ids (created via Supabase Auth)
-- before running.
-- =====================================================================

-- Assume these users already exist in auth.users:
--   :admin_id  -> the studio owner
--   :ahmed_id  -> the assistant

insert into profiles (id, full_name, job_title, is_admin, status)
values (:'admin_id', 'Admin', 'Owner', true, 'active')
on conflict (id) do nothing;

insert into profiles (id, full_name, job_title, is_admin, status)
values (:'ahmed_id', 'Ahmed', 'Assistant', false, 'active')
on conflict (id) do nothing;

-- Ahmed: view + edit only, scoped to assigned bookings only.
insert into user_permissions (
  user_id, can_view_bookings, can_create_booking, can_edit_booking,
  can_delete_booking, can_change_status, can_add_notes, booking_scope
) values (
  :'ahmed_id', true, false, true, false, false, false, 'assigned_only'
)
on conflict (user_id) do update set
  can_view_bookings = excluded.can_view_bookings,
  can_create_booking = excluded.can_create_booking,
  can_edit_booking = excluded.can_edit_booking,
  can_delete_booking = excluded.can_delete_booking,
  can_change_status = excluded.can_change_status,
  can_add_notes = excluded.can_add_notes,
  booking_scope = excluded.booking_scope;

-- Field grants matching the spec's example table for Ahmed.
insert into user_field_permissions (user_id, field_name, can_view, can_edit) values
  (:'ahmed_id', 'customer_name', true,  false),
  (:'ahmed_id', 'customer_phone', true, false),
  (:'ahmed_id', 'booking_date',  true,  false),
  (:'ahmed_id', 'time',          true,  false),
  (:'ahmed_id', 'location',      true,  false),
  (:'ahmed_id', 'booking_type',  true,  false),
  (:'ahmed_id', 'price',         false, false),
  (:'ahmed_id', 'deposit',       false, false),
  (:'ahmed_id', 'remaining',     false, false),
  (:'ahmed_id', 'printing',      true,  true),
  (:'ahmed_id', 'notes',         true,  false),
  (:'ahmed_id', 'reminder',      true,  false)
on conflict (user_id, field_name) do update set
  can_view = excluded.can_view,
  can_edit = excluded.can_edit;

-- Example booking + assignment ("حنة محمد")
insert into bookings (
  id, customer_name, customer_phone, booking_types, booking_date,
  start_time, location, price, deposit_paid, deposit_amount, status, created_by
) values (
  gen_random_uuid(), 'حنة محمد', '010XXXXXXXX', array['henna']::booking_type[], '2026-08-20',
  '19:00', 'التجمع الخامس', 8000, true, 3000, 'confirmed', :'admin_id'
) returning id \gset booking_

insert into booking_assignees (booking_id, user_id) values (:'booking_id', :'ahmed_id');

insert into booking_printing (booking_id, has_printing, album_30x45) values (:'booking_id', true, true);
