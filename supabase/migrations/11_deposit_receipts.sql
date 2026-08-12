alter table public.bookings
  add column if not exists deposit_receipt_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deposit-receipts',
  'deposit-receipts',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated users upload deposit receipts" on storage.objects;
create policy "authenticated users upload deposit receipts"
on storage.objects for insert
to authenticated
with check (bucket_id = 'deposit-receipts');

drop policy if exists "authenticated users update deposit receipts" on storage.objects;
create policy "authenticated users update deposit receipts"
on storage.objects for update
to authenticated
using (bucket_id = 'deposit-receipts')
with check (bucket_id = 'deposit-receipts');

drop policy if exists "authenticated users delete deposit receipts" on storage.objects;
create policy "authenticated users delete deposit receipts"
on storage.objects for delete
to authenticated
using (bucket_id = 'deposit-receipts');
