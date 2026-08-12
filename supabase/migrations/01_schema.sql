-- =====================================================================
-- 01_schema.sql
-- Photography Booking Management System — Core Schema
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type user_status as enum ('active', 'disabled');

create type booking_access_scope as enum ('all', 'assigned_only', 'selected');

create type payment_status as enum ('not_paid', 'partial', 'paid');

create type printing_status as enum ('not_started', 'preparing', 'ready', 'delivered');

create type booking_status as enum (
  'new', 'waiting_deposit', 'confirmed', 'upcoming',
  'photographed', 'preparing', 'ready', 'delivered', 'cancelled'
);

create type booking_type as enum (
  'session', 'hall', 'henna', 'shabaka', 'katb_ketab', 'party', 'wedding', 'other'
);

create type reminder_type as enum ('1h', '2h', '3h', '6h', '12h', '1d', 'custom');

-- Canonical list of "controllable" fields used by the permissions system.
-- Kept as a domain-level check via a lookup table so the admin UI can render
-- a fixed, validated list (matches section 6 of the spec).
create table field_catalog (
  field_name text primary key,
  label_ar text not null
);

insert into field_catalog (field_name, label_ar) values
  ('customer_name', 'اسم العميل'),
  ('customer_phone', 'رقم العميل'),
  ('booking_type', 'نوع الحجز'),
  ('booking_date', 'تاريخ الحجز'),
  ('time', 'الوقت'),
  ('location', 'المكان'),
  ('price', 'سعر الحجز'),
  ('deposit', 'المدفوع'),
  ('remaining', 'الباقي'),
  ('printing', 'الطباعة'),
  ('notes', 'الملاحظات'),
  ('reminder', 'Reminder');

-- ---------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  job_title text,              -- مصور / مساعد / موظف / Editor / Manager (free text label only)
  is_admin boolean not null default false,
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),

  -- بيانات العميل
  customer_name text not null,
  customer_phone text,
  customer_whatsapp text,

  -- بيانات الحجز
  title text,
  booking_types booking_type[] not null default '{}',
  other_type_text text,
  booking_date date not null,
  start_time time,
  end_time time,
  location text,
  location_url text,           -- google maps link, optional
  notes text,

  -- الحساب المالي
  price numeric(12,2) not null default 0,
  deposit_paid boolean not null default false,
  deposit_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) generated always as (price - deposit_amount) stored,
  payment_status payment_status generated always as (
    case
      when deposit_amount <= 0 then 'not_paid'::payment_status
      when deposit_amount >= price then 'paid'::payment_status
      else 'partial'::payment_status
    end
  ) stored,

  status booking_status not null default 'new',

  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_deposit_amount check (deposit_amount >= 0 and deposit_amount <= price + 0.01)
);

create index idx_bookings_date on bookings (booking_date);
create index idx_bookings_status on bookings (status);

-- ---------------------------------------------------------------------
-- PRINTING (1:1 with bookings)
-- ---------------------------------------------------------------------
create table booking_printing (
  booking_id uuid primary key references bookings (id) on delete cascade,
  has_printing boolean not null default false,
  large_tableau boolean not null default false,
  small_tableau boolean not null default false,
  album_30x45 boolean not null default false,
  album_30x60 boolean not null default false,
  card_photos boolean not null default false,
  card_photos_count int,
  printing_status printing_status not null default 'not_started',
  updated_at timestamptz not null default now(),

  constraint chk_card_photos_count check (
    (card_photos = false) or (card_photos = true and card_photos_count is not null and card_photos_count > 0)
  )
);

-- ---------------------------------------------------------------------
-- REMINDERS
-- ---------------------------------------------------------------------
create table booking_reminders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  reminder_type reminder_type not null,
  custom_datetime timestamptz,          -- only used when reminder_type = 'custom'
  remind_at timestamptz,                -- computed by trigger (see 02_functions_triggers.sql)
  sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now(),

  constraint chk_custom_datetime check (
    (reminder_type = 'custom' and custom_datetime is not null)
    or (reminder_type <> 'custom')
  )
);

create index idx_reminders_due on booking_reminders (remind_at) where sent = false;

-- ---------------------------------------------------------------------
-- ASSIGNMENTS (المسؤول عن الحجز — one or more users)
-- ---------------------------------------------------------------------
create table booking_assignees (
  booking_id uuid not null references bookings (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (booking_id, user_id)
);

-- ---------------------------------------------------------------------
-- PERMISSIONS
-- ---------------------------------------------------------------------
create table user_permissions (
  user_id uuid primary key references profiles (id) on delete cascade,
  can_view_bookings boolean not null default false,
  can_create_booking boolean not null default false,
  can_edit_booking boolean not null default false,
  can_delete_booking boolean not null default false,
  can_change_status boolean not null default false,
  can_add_notes boolean not null default false,
  booking_scope booking_access_scope not null default 'assigned_only',
  updated_at timestamptz not null default now()
);

-- Used only when booking_scope = 'selected'
create table user_selected_bookings (
  user_id uuid not null references profiles (id) on delete cascade,
  booking_id uuid not null references bookings (id) on delete cascade,
  primary key (user_id, booking_id)
);

-- Field-level view/edit control (section 6 of the spec)
create table user_field_permissions (
  user_id uuid not null references profiles (id) on delete cascade,
  field_name text not null references field_catalog (field_name),
  can_view boolean not null default false,
  can_edit boolean not null default false,
  primary key (user_id, field_name)
);
