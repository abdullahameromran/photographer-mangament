-- A studio member inherits the subscription of the studio owner.
-- No subscription data from unrelated studios is exposed.
create or replace function public.current_effective_subscription()
returns setof public.subscriptions
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.subscriptions s
  where s.user_id = auth.uid()
     or s.user_id = (
       select st.owner_id
       from public.profiles p
       join public.studios st on st.id = p.studio_id
       where p.id = auth.uid()
     )
  order by case when s.user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

revoke all on function public.current_effective_subscription() from public;
grant execute on function public.current_effective_subscription() to authenticated;
