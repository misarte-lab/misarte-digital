-- MisArte Digital v1.5.0 — Sprint 2
-- Execute no SQL Editor do Supabase antes de testar a Sprint 2.

alter table public.clientes
  add column if not exists cor_destaque text default '#D6A85F',
  add column if not exists cor_fundo text default '#07140F',
  add column if not exists fontes_favoritas jsonb default '[]'::jsonb;

update public.clientes
set
  cor_destaque = coalesce(cor_destaque, '#D6A85F'),
  cor_fundo = coalesce(cor_fundo, case when tema = 'claro' then '#F7F7F3' else '#07140F' end),
  fontes_favoritas = coalesce(fontes_favoritas, '[]'::jsonb);
