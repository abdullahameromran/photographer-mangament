alter table public.bookings add column if not exists addons jsonb not null default '[]'::jsonb;
alter table public.bookings add column if not exists custom_print_items jsonb not null default '[]'::jsonb;
alter table public.bookings add column if not exists expenses jsonb not null default '[]'::jsonb;

insert into public.field_catalog(field_name,label_ar) values
 ('addons','إضافات الحجز المرنة'),('expenses','المصاريف الداخلية وصافي الربح')
on conflict(field_name) do update set label_ar=excluded.label_ar;

insert into public.user_field_permissions(user_id,field_name,can_view,can_edit)
select p.id,f.field_name,p.is_admin,p.is_admin from public.profiles p
cross join (values('addons'),('expenses')) f(field_name)
on conflict(user_id,field_name) do nothing;

create or replace function public.protect_booking_custom_fields()
returns trigger language plpgsql security definer set search_path=public as $$ begin
 if new.addons is distinct from old.addons and not public.field_can_edit('addons') then raise exception 'Not permitted to edit booking addons'; end if;
 if new.custom_print_items is distinct from old.custom_print_items and not public.field_can_edit('printing') then raise exception 'Not permitted to edit custom print items'; end if;
 if new.expenses is distinct from old.expenses and not public.field_can_edit('expenses') then raise exception 'Not permitted to edit booking expenses'; end if;
 return new;
end $$;
drop trigger if exists trg_protect_booking_custom_fields on public.bookings;
create trigger trg_protect_booking_custom_fields before update on public.bookings for each row execute function public.protect_booking_custom_fields();
