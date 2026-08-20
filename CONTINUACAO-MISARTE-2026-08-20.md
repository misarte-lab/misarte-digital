# Continuação do projeto MisArte Digital

Data do ponto de restauração: 20/08/2026

## Estado do projeto

- Projeto local conectado ao repositório `misarte-lab/misarte-digital`.
- Site publicado em `https://misarte.link/`.
- Supabase conectado ao projeto da MisArte.
- Último commit publicado antes deste documento: `Inicia catálogo nativo com imagens de produtos` (`7ab3eaf`).

## Alterações concluídas

### Página principal

- Texto alterado de “Primeiro projeto publicado.” para “Último projeto publicado.”.
- Botão alterado para “Ver último projeto publicado”.
- Layout, imagem e nome do cliente foram preservados.

### Miniaturas dos PDFs

- O painel deixou de incorporar o PDF completo dentro do cartão.
- A miniatura renderiza somente a página 1.
- A prévia mostra o cabeçalho/parte superior da primeira página.
- O PDF completo continua disponível pelo botão de abertura.

### QR Codes

- Cada cliente utiliza um endereço definitivo no formato `misarte.link/nome-do-cliente/`.
- O QR Code aparece automaticamente no painel.
- Alterações nos catálogos não mudam o endereço nem o QR Code.
- O QR Code da Cervejaria Inconfidentes aponta para `https://misarte.link/cervejaria-inconfidentes/`.

### Catálogo nativo

- Decisão: a MisArte terá editor próprio de catálogos.
- Canva e PDF ficam apenas como compatibilidade durante a transição.
- A estrutura existente já contém clientes, catálogos, categorias, produtos, preços, disponibilidade, destaque e página pública.
- Foi adicionada a coluna `imagem_url` à tabela `produtos` no Supabase.
- O SQL abaixo já foi executado:

```sql
alter table public.produtos
  add column if not exists imagem_url text;
```

- O painel agora aceita imagens JPEG, PNG e WebP nos produtos.
- As imagens são reduzidas automaticamente, convertidas para WebP e organizadas por cliente e catálogo.
- Transparência de imagens PNG/WebP é preservada.
- As imagens aparecem no painel administrativo e no catálogo público.

## Decisões importantes

- Não implementar remoção automática de fundo agora.
- As imagens serão tratadas no Canva e enviadas já sem fundo.
- No futuro poderá ser integrada uma remoção profissional com prévia e opção de manter o original.
- O plano atual do Supabase é gratuito.
- Limites atuais considerados: 50 MB por arquivo e 1 GB de armazenamento total.
- Para operação com muitos clientes será necessário migrar para infraestrutura de produção.
- Não aumentar apenas o limite de PDF sem criar envio retomável e processamento adequado.

## Próximo passo exato

Testar o primeiro produto com imagem no catálogo nativo:

1. Abrir o painel administrativo.
2. Abrir Cervejaria Inconfidentes.
3. Abrir Catálogos.
4. Abrir “Cervejas Artesanais”.
5. Criar uma categoria, pois esse catálogo ainda estava com zero categorias.
6. Clicar em “Gerenciar produtos”.
7. Criar um produto com nome, preço, descrição e imagem transparente exportada do Canva.
8. Salvar e conferir a imagem no painel.
9. Abrir a página pública e validar a apresentação.

## Evolução planejada do catálogo nativo

1. Editor essencial de categorias, produtos, imagens, preços, descrição, ordem e disponibilidade.
2. Fluxo claro de rascunho, prévia e publicação.
3. Modelos visuais por cliente.
4. Editor de páginas, capas, banners e blocos.
5. Histórico de versões e restauração.
6. Duplicação de catálogos e promoções programadas.
7. Migração futura para infraestrutura adequada a 50–200 clientes.

## Como retomar depois de reinstalar o computador

1. Entrar no GitHub com a conta `misarte-lab`.
2. Instalar o VS Code e o Git.
3. Clonar `https://github.com/misarte-lab/misarte-digital.git`.
4. Entrar no Supabase usando “Continue with GitHub”.
5. Abrir este documento e continuar a partir de “Próximo passo exato”.

