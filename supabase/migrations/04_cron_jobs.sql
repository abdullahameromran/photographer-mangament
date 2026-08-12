-- =====================================================================
-- 04_cron_jobs.sql
-- Scheduled work using pg_cron (+ pg_net to call an Edge Function).
-- Run this migration with a role that can create extensions
-- (in the Supabase SQL editor this is fine; via CLI use a superuser
-- migration or enable both extensions from Database > Extensions first).
-- =====================================================================
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------
-- Store the Edge Function URL + service role key using Supabase Vault
-- so they aren't hard-coded in SQL. Run once, from the SQL editor:
--
--   select vault.create_secret('https://<project-ref>.functions.supabase.co/send-reminder', 'edge_function_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
--
-- The functions below read them back out of vault.decrypted_secrets.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- process_due_reminders()
-- Finds reminders whose remind_at has passed and haven't been sent,
-- POSTs each to the send-reminder Edge Function, and marks them sent.
-- pg_net calls are async (fire-and-forget from SQL's point of view);
-- we optimistically mark sent=true here and let the Edge Function be
-- the source of truth for actual delivery/retries.
-- ---------------------------------------------------------------------
create or replace function process_due_reminders()
returns void
language plpgsql security definer set search_path = public, extensions, vault as $$
declare
  v_url text;
  v_key text;
  r record;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'edge_function_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null then
    raise notice 'edge_function_url secret not configured, skipping reminder dispatch';
    return;
  end if;

  for r in
    select
      br.id as reminder_id,
      br.booking_id,
      b.customer_name,
      b.customer_phone,
      b.customer_whatsapp,
      b.booking_date,
      b.start_time,
      b.title,
      br.reminder_type
    from booking_reminders br
    join bookings b on b.id = br.booking_id
    where br.sent = false
      and br.remind_at is not null
      and br.remind_at <= now()
      and b.status <> 'cancelled'
  loop
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(v_key, '')
      ),
      body := jsonb_build_object(
        'reminder_id', r.reminder_id,
        'booking_id', r.booking_id,
        'customer_name', r.customer_name,
        'customer_phone', r.customer_phone,
        'customer_whatsapp', r.customer_whatsapp,
        'booking_date', r.booking_date,
        'start_time', r.start_time,
        'title', r.title,
        'reminder_type', r.reminder_type
      )
    );

    update booking_reminders
       set sent = true, sent_at = now()
     where id = r.reminder_id;
  end loop;
end;
$$;

-- Run every 5 minutes.
select cron.schedule(
  'process-due-reminders',
  '*/5 * * * *',
  $$select process_due_reminders();$$
);

-- ---------------------------------------------------------------------
-- auto_advance_booking_status()
-- Business rule (not explicit in the spec but implied by the status
-- list): once a *confirmed* booking's date is within the next 24h,
-- flip it to 'upcoming' automatically. Adjust/remove freely — this is
-- the one status transition that's inherently time-based rather than
-- event-based, so it belongs in cron rather than a table trigger.
-- ---------------------------------------------------------------------
create or replace function auto_advance_booking_status()
returns void
language sql security definer set search_path = public as $$
  update bookings
     set status = 'upcoming'
   where status = 'confirmed'
     and (booking_date + coalesce(start_time, '00:00'::time))::timestamptz <= now() + interval '24 hours'
     and (booking_date + coalesce(start_time, '00:00'::time))::timestamptz > now();
$$;

-- Run every 30 minutes.
select cron.schedule(
  'auto-advance-booking-status',
  '*/30 * * * *',
  $$select auto_advance_booking_status();$$
);

-- ---------------------------------------------------------------------
-- Housekeeping: prune sent reminders older than 90 days (optional).
-- ---------------------------------------------------------------------
create or replace function prune_old_sent_reminders()
returns void
language sql security definer set search_path = public as $$
  delete from booking_reminders
   where sent = true and sent_at < now() - interval '90 days';
$$;

-- Run daily at 03:00.
select cron.schedule(
  'prune-old-sent-reminders',
  '0 3 * * *',
  $$select prune_old_sent_reminders();$$
);

-- ---------------------------------------------------------------------
-- Useful admin queries:
--   select * from cron.job;                     -- list scheduled jobs
--   select * from cron.job_run_details order by start_time desc limit 20;
--   select cron.unschedule('process-due-reminders');
-- ---------------------------------------------------------------------
