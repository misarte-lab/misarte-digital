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

## Atualização posterior do mesmo dia

- O primeiro produto com imagem foi cadastrado com sucesso no catálogo nativo.
- Foi identificado que a imagem aparecia cortada no cartão.
- O código foi ajustado para mostrar a imagem completa, usando encaixe sem recorte, tanto no painel administrativo quanto no catálogo público.
- Esse ajuste modificou:
  - `admin/css/admin.css`
  - `admin/produtos.html`
  - `publico.css`
  - `publico.html`
- O próximo teste é atualizar o painel com `Ctrl + F5` e confirmar a imagem completa.
- O VS Code começou a apresentar o erro `launch-failed`, código `57`, após falhas do processo de extensões.
- Tentativa recomendada para reabrir em modo seguro:

```text
"C:\Users\mis_c\AppData\Local\Programs\Microsoft VS Code\Code.exe" --disable-extensions --disable-gpu
```

- Se o erro persistir, o projeto e este documento permanecem preservados no GitHub.

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

## Ponto de continuidade — Editor visual (20/08/2026, final do dia)

### Regra principal confirmada

- Não alterar nem substituir agora o catálogo original entregue à Cervejaria Inconfidentes.
- Não alterar o endereço nem o QR Code definitivo do cliente.
- Construir primeiro todo o sistema de criação visual dentro da MisArte.
- Somente quando o editor estiver completo, recriar/importar os catálogos existentes e publicar de forma controlada.
- O painel administrativo pertence exclusivamente à MisArte; clientes não possuem acesso de edição.

### Editor visual criado e publicado

- Novo módulo: `admin/editor-visual.html`.
- O catálogo de teste é o catálogo `7`, chamado “Cervejas Artesanais”, mantido como rascunho.
- O editor possui:
  - criação e exclusão de páginas;
  - duplicação de páginas com seus elementos;
  - arte de fundo completa;
  - importação de PDF;
  - conversão sequencial das páginas do PDF em WebP otimizado;
  - lista de páginas com rolagem independente;
  - página central fixa;
  - zoom de 50% a 200%;
  - prévia privada autenticada;
  - áreas clicáveis visíveis ou invisíveis;
  - arraste e gravação automática da posição;
  - destinos para página, categoria, produto ou URL.
- O PDF da Cervejaria foi importado e gerou 58 páginas visuais.
- A arte completa das páginas foi preservada.

### SQL executado

- O arquivo `supabase/v1.7.0-editor-visual.sql` já foi executado com sucesso no Supabase.
- Foram criadas as tabelas:
  - `catalogo_paginas`;
  - `pagina_elementos`.
- As políticas permitem administração somente pela conta `miscristiane@gmail.com`.

### Interatividade da capa

- As medidas exatas dos botões do catálogo original foram recuperadas:
  - posição horizontal: `24.4%`;
  - largura: `56.2%`;
  - altura: `6.3%`.
- Destinos originais confirmados:
  - Ouropretana → página 2 (`top: 48.1%`);
  - Baden Baden → página 13 (`top: 55.4%`);
  - Verace → página 18 (`top: 62.7%`);
  - Backer → página 30 (`top: 70.0%`);
  - Krug → página 41 (`top: 77.3%`);
  - Marianense → página 56 (`top: 84.6%`).
- Foi criado o botão **Configurar as 6 marcas automaticamente**, que substitui as áreas de teste e cria as seis áreas com posições e destinos exatos.
- Na edição, áreas invisíveis aparecem pontilhadas; na prévia e no catálogo final ficam totalmente transparentes.

### Menu superior planejado

- O catálogo final também deverá reproduzir o menu no canto superior direito.
- O menu abrirá todas as marcas e suas respectivas cervejas.
- Cada cerveja levará diretamente à sua página.
- A última página de cada marca terá uma área sobre “Voltar ao início”, ligada à capa.
- O arquivo `supabase/v1.7.1-menu-visual.sql` já está no GitHub, mas **ainda precisa ser executado no Supabase**.
- Esse SQL adicionará a cada página:
  - marca/grupo do menu;
  - título exibido no menu;
  - opção de mostrar ou ocultar no menu.

### Última versão publicada

- Commit mais recente: `db47603` — “Configura automaticamente links da capa”.
- Repositório local e GitHub estavam sincronizados após esse commit.
- Endereço recomendado para evitar cache:
  - `https://misarte.link/admin/editor-visual.html?cliente=1&catalogo=7&versao=12`

### Próximo passo exato ao retomar

1. Abrir o endereço do Editor visual acima.
2. Selecionar a página **Capa**.
3. Clicar em **Configurar as 6 marcas automaticamente**.
4. Confirmar a substituição das áreas de teste.
5. Abrir **Prévia da página** e testar as seis faixas inteiras.
6. Executar `supabase/v1.7.1-menu-visual.sql` no SQL Editor do Supabase.
7. Desenvolver e testar o menu superior agrupado por marca e cerveja.
8. Criar automaticamente os botões “Voltar ao início” nas últimas páginas de cada marca.
9. Manter o catálogo original e o QR Code atuais sem alterações durante todo esse processo.
