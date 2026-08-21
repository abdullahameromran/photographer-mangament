-- Promote the known platform owner. This is intentionally idempotent.
insert into public.super_admins(user_id)
select id
from auth.users
where lower(email) = lower('admin@studioflow.app')
on conflict (user_id) do nothing;
