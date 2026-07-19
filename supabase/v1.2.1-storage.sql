-- MisArte Digital v1.2.1 — Storage de clientes
-- Execute uma vez no Supabase: SQL Editor > New query > Run

alter table public.clientes
  add column if not exists logo_url text,
  add column if not exists capa_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clientes',
  'clientes',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "misarte clientes storage insert" on storage.objects;
drop policy if exists "misarte clientes storage update" on storage.objects;
drop policy if exists "misarte clientes storage delete" on storage.objects;
drop policy if exists "misarte clientes storage select" on storage.objects;

create policy "misarte clientes storage select"
on storage.objects for select
using (bucket_id = 'clientes');

create policy "misarte clientes storage insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'clientes'
  and (auth.jwt() ->> 'email') = 'miscristiane@gmail.com'
);

create policy "misarte clientes storage update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'clientes'
  and (auth.jwt() ->> 'email') = 'miscristiane@gmail.com'
)
with check (
  bucket_id = 'clientes'
  and (auth.jwt() ->> 'email') = 'miscristiane@gmail.com'
);

create policy "misarte clientes storage delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'clientes'
  and (auth.jwt() ->> 'email') = 'miscristiane@gmail.com'
);
