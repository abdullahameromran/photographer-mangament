alter table public.bookings add column if not exists type_schedules jsonb not null default '[]'::jsonb;
