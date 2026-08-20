-- MisArte Digital v1.6.0 — Catálogo nativo
-- Execute uma única vez em Supabase > SQL Editor > New query > Run

alter table public.produtos
  add column if not exists imagem_url text;

-- A política pública existente de produtos continua controlando quais
-- registros podem ser vistos. As imagens ficam no bucket público "clientes"
-- e são organizadas em clientes/{cliente}/catalogos/{catalogo}/produtos/.
