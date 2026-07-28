# Sprint 2.3.1 — QR Codes

## Ordem de instalação

1. No Supabase, abra **SQL Editor**.
2. Execute todo o arquivo:
   `supabase/v1.5.0-sprint2.3.1-qrcodes.sql`
3. No projeto do GitHub, copie os arquivos deste ZIP preservando as pastas.
4. Confirme que ficaram assim:
   - `admin/qrcodes.html`
   - `admin/js/qrcodes.js`
   - `admin/css/qrcodes.css`
   - `supabase/v1.5.0-sprint2.3.1-qrcodes.sql`
5. Substitua também:
   - `admin/dashboard.html`
   - `admin/clientes.html`
   Esses dois arquivos receberam somente o acesso **QR Codes** no menu.
6. Faça o deploy e abra `admin/qrcodes.html`.

## Teste

- Criar QR Code;
- visualizar;
- baixar PNG;
- editar;
- arquivar;
- pesquisar e filtrar.

## Observação

O gerador usa a biblioteca QRCode.js carregada por CDN. O QR contém a URL salva no Supabase.
