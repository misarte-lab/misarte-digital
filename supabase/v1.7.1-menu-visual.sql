-- MisArte Digital v1.7.1 — Menu visual por marcas e produtos
-- Execute uma única vez em Supabase > SQL Editor > New query > Run

alter table public.catalogo_paginas
  add column if not exists menu_grupo text,
  add column if not exists menu_titulo text,
  add column if not exists mostrar_menu boolean not null default false;

create index if not exists catalogo_paginas_menu_idx
  on public.catalogo_paginas(catalogo_id, menu_grupo, ordem)
  where mostrar_menu = true;

comment on column public.catalogo_paginas.menu_grupo is
  'Marca ou grupo usado para organizar a página no menu do catálogo.';

comment on column public.catalogo_paginas.menu_titulo is
  'Nome exibido para esta página dentro do menu.';

comment on column public.catalogo_paginas.mostrar_menu is
  'Define se a página aparece no menu visual do catálogo.';

