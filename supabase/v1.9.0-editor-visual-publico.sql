-- MisArte Digital v1.9.0 — Publicação segura do Editor visual no QR
-- Execute uma única vez antes de associar ao QR um catálogo criado no Editor visual.

drop policy if exists "misarte catalogo paginas public select" on public.catalogo_paginas;
create policy "misarte catalogo paginas public select"
on public.catalogo_paginas for select to anon
using (
  status = 'ativa' and exists (
    select 1 from public.catalogos
    join public.clientes on clientes.id = catalogos.cliente_id
    where catalogos.id = catalogo_paginas.catalogo_id
      and catalogos.status = 'publicado'
      and clientes.status = 'ativo'
      and clientes.catalogo_qr_id = catalogos.id
  )
);

drop policy if exists "misarte pagina elementos public select" on public.pagina_elementos;
create policy "misarte pagina elementos public select"
on public.pagina_elementos for select to anon
using (
  exists (
    select 1 from public.catalogo_paginas
    join public.catalogos on catalogos.id = catalogo_paginas.catalogo_id
    join public.clientes on clientes.id = catalogos.cliente_id
    where catalogo_paginas.id = pagina_elementos.pagina_id
      and catalogo_paginas.status = 'ativa'
      and catalogos.status = 'publicado'
      and clientes.status = 'ativo'
      and clientes.catalogo_qr_id = catalogos.id
  )
);
