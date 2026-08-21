-- Keep an RLS-protected copy of the account email on profiles so the platform
-- administrator can see it even when the Auth schema is unavailable via REST.
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;

create or replace function public.sync_auth_email_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_synced on auth.users;
create trigger on_auth_user_email_synced
after insert or update of email on auth.users
for each row execute function public.sync_auth_email_to_profile();

create index if not exists idx_profiles_email on public.profiles(lower(email));
