-- Full subscriber/workspace details for the platform administrator only.
create or replace function public.get_subscriber_details(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_result jsonb;
begin
  if not public.is_super_admin(auth.uid()) then raise exception 'Not authorized'; end if;

  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id, 'full_name', p.full_name, 'email', p.email,
      'phone', p.phone, 'job_title', p.job_title, 'status', p.status,
      'created_at', p.created_at, 'studio_id', p.studio_id,
      'studio_name', st.name
    ),
    'subscription', jsonb_build_object(
      'plan_code', s.plan_code, 'starts_at', s.starts_at,
      'expires_at', s.expires_at, 'enabled', s.enabled, 'notes', s.notes
    ),
    'summary', jsonb_build_object(
      'bookings_count', count(b.id),
      'total_price', coalesce(sum(b.price), 0),
      'total_paid', coalesce(sum(b.deposit_amount), 0),
      'total_remaining', coalesce(sum(b.remaining_amount), 0)
    ),
    'bookings', coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'title', b.title, 'customer_name', b.customer_name,
      'customer_phone', b.customer_phone, 'booking_date', b.booking_date,
      'start_time', b.start_time, 'end_time', b.end_time,
      'location', b.location, 'price', b.price,
      'paid', b.deposit_amount, 'remaining', b.remaining_amount,
      'payment_status', b.payment_status, 'status', b.status,
      'created_at', b.created_at
    ) order by b.booking_date desc) filter (where b.id is not null), '[]'::jsonb)
  ) into v_result
  from public.profiles p
  join public.subscriptions s on s.user_id = p.id
  left join public.studios st on st.id = p.studio_id
  left join public.bookings b on b.studio_id = p.studio_id
  where p.id = p_user
  group by p.id, p.full_name, p.email, p.phone, p.job_title, p.status,
           p.created_at, p.studio_id, st.name, s.plan_code, s.starts_at,
           s.expires_at, s.enabled, s.notes;

  if v_result is null then raise exception 'Subscriber not found'; end if;
  return v_result;
end;
$$;

revoke all on function public.get_subscriber_details(uuid) from public;
grant execute on function public.get_subscriber_details(uuid) to authenticated;
