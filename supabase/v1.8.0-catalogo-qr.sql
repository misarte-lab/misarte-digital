-- MisArte Digital v1.8.0 — Catálogo associado ao QR do cliente
-- Execute uma única vez no Supabase antes de publicar o painel v1.8.0.

alter table public.clientes
  add column if not exists catalogo_qr_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clientes_catalogo_qr_id_fkey'
  ) then
    alter table public.clientes
      add constraint clientes_catalogo_qr_id_fkey
      foreign key (catalogo_qr_id)
      references public.catalogos(id)
      on delete set null;
  end if;
end $$;

create or replace function public.validar_catalogo_qr_cliente()
returns trigger
language plpgsql
as $$
begin
  if new.catalogo_qr_id is not null and not exists (
    select 1
    from public.catalogos
    where id = new.catalogo_qr_id
      and cliente_id = new.id
      and status = 'publicado'
  ) then
    raise exception 'O catálogo do QR deve pertencer ao cliente e estar publicado.';
  end if;
  return new;
end;
$$;

drop trigger if exists clientes_validar_catalogo_qr on public.clientes;
create trigger clientes_validar_catalogo_qr
before insert or update of catalogo_qr_id on public.clientes
for each row execute function public.validar_catalogo_qr_cliente();

comment on column public.clientes.catalogo_qr_id is
  'Catálogo publicado que deve abrir no endereço permanente e no QR do cliente.';

-- Configuração inicial confirmada para a Cervejaria Inconfidentes:
-- o Cardápio é o material impresso e Cervejas Artesanais é o catálogo do QR.
update public.catalogos
set destaque = (
  id = (
    select catalogo_qr.id
    from public.catalogos as catalogo_qr
    where catalogo_qr.cliente_id = catalogos.cliente_id
      and lower(catalogo_qr.nome) = 'cervejas artesanais'
      and catalogo_qr.status = 'publicado'
    order by catalogo_qr.id
    limit 1
  )
)
where cliente_id = (
  select id from public.clientes
  where slug = 'cervejaria-inconfidentes'
  limit 1
)
and lower(nome) in ('cardápio', 'cardapio', 'cervejas artesanais');

update public.clientes as cliente
set catalogo_qr_id = (
  select catalogo.id
  from public.catalogos as catalogo
  where catalogo.cliente_id = cliente.id
    and lower(catalogo.nome) = 'cervejas artesanais'
    and catalogo.status = 'publicado'
  order by catalogo.id
  limit 1
)
where cliente.slug = 'cervejaria-inconfidentes'
  and exists (
    select 1
    from public.catalogos as catalogo
    where catalogo.cliente_id = cliente.id
      and lower(catalogo.nome) = 'cervejas artesanais'
      and catalogo.status = 'publicado'
  );
