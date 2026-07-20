-- MisArte Digital v1.4.0 — Página pública permanente por cliente
-- Execute uma única vez em Supabase > SQL Editor > New query > Run

-- Permite que visitantes vejam somente clientes ativos.
drop policy if exists "misarte clientes public select" on public.clientes;
create policy "misarte clientes public select"
on public.clientes for select
to anon
using (status = 'ativo');

-- Permite que visitantes vejam somente catálogos publicados de clientes ativos.
drop policy if exists "misarte catalogos public select" on public.catalogos;
create policy "misarte catalogos public select"
on public.catalogos for select
to anon
using (
  status = 'publicado'
  and exists (
    select 1
    from public.clientes
    where clientes.id = catalogos.cliente_id
      and clientes.status = 'ativo'
  )
);

-- Permite que visitantes vejam somente categorias ativas de catálogos publicados.
drop policy if exists "misarte categorias public select" on public.categorias;
create policy "misarte categorias public select"
on public.categorias for select
to anon
using (
  status = 'ativa'
  and exists (
    select 1
    from public.catalogos
    join public.clientes on clientes.id = catalogos.cliente_id
    where catalogos.id = categorias.catalogo_id
      and catalogos.status = 'publicado'
      and clientes.status = 'ativo'
  )
);

-- Permite que visitantes vejam somente produtos disponíveis.
drop policy if exists "misarte produtos public select" on public.produtos;
create policy "misarte produtos public select"
on public.produtos for select
to anon
using (
  status = 'disponivel'
  and exists (
    select 1
    from public.categorias
    join public.catalogos on catalogos.id = categorias.catalogo_id
    join public.clientes on clientes.id = catalogos.cliente_id
    where categorias.id = produtos.categoria_id
      and categorias.status = 'ativa'
      and catalogos.status = 'publicado'
      and clientes.status = 'ativo'
  )
);
