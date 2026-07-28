-- MisArte Digital — Sprint 2.3.1 — Módulo QR Codes
-- Execute este arquivo no SQL Editor do Supabase uma única vez.

create extension if not exists pgcrypto;

create table if not exists public.qrcodes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  codigo text not null unique,
  nome text not null,
  tipo text not null default 'personalizado'
    check (tipo in ('cardapio','instagram','whatsapp','site','google_maps','personalizado')),
  url_destino text not null,
  status text not null default 'ativo'
    check (status in ('ativo','inativo','arquivado')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qrcodes_cliente_id_idx on public.qrcodes(cliente_id);
create index if not exists qrcodes_status_idx on public.qrcodes(status);
create index if not exists qrcodes_created_at_idx on public.qrcodes(created_at desc);

create or replace function public.set_qrcodes_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists qrcodes_set_updated_at on public.qrcodes;
create trigger qrcodes_set_updated_at
before update on public.qrcodes
for each row execute function public.set_qrcodes_updated_at();

alter table public.qrcodes enable row level security;

drop policy if exists "Usuários autenticados podem visualizar qrcodes" on public.qrcodes;
create policy "Usuários autenticados podem visualizar qrcodes"
on public.qrcodes for select
to authenticated
using (true);

drop policy if exists "Usuários autenticados podem criar qrcodes" on public.qrcodes;
create policy "Usuários autenticados podem criar qrcodes"
on public.qrcodes for insert
to authenticated
with check (true);

drop policy if exists "Usuários autenticados podem atualizar qrcodes" on public.qrcodes;
create policy "Usuários autenticados podem atualizar qrcodes"
on public.qrcodes for update
to authenticated
using (true)
with check (true);

grant select, insert, update on public.qrcodes to authenticated;
