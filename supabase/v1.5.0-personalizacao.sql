-- MisArte Digital v1.5.0 — Personalização da Página Pública
-- Execute uma única vez em Supabase > SQL Editor > New query > Run

alter table public.clientes
  add column if not exists cor_primaria text not null default '#B8DBC3',
  add column if not exists cor_secundaria text not null default '#173C2C',
  add column if not exists cor_texto text not null default '#F5F4ED',
  add column if not exists cor_botao text not null default '#B8DBC3',
  add column if not exists tema text not null default 'escuro',
  add column if not exists fonte text not null default 'DM Sans',
  add column if not exists banner_url text,
  add column if not exists favicon_url text,
  add column if not exists catalogo_destaque bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_catalogo_destaque_fkey'
  ) then
    alter table public.clientes
      add constraint clientes_catalogo_destaque_fkey
      foreign key (catalogo_destaque)
      references public.catalogos(id)
      on delete set null;
  end if;
end $$;

alter table public.clientes
  drop constraint if exists clientes_tema_check;

alter table public.clientes
  add constraint clientes_tema_check
  check (tema in ('claro','escuro'));

-- O bucket "clientes" criado na v1.2.1 já aceita banner e favicon.
-- Os arquivos serão organizados em:
-- clientes/{cliente_id}/banner.ext
-- clientes/{cliente_id}/favicon.ext
