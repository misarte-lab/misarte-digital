# MisArte Admin v1.2.0

## Teste rápido

1. Publique os arquivos no GitHub Pages.
2. Acesse `admin/login.html` e entre normalmente.
3. Abra **Clientes** no menu lateral.
4. Teste criar, editar, buscar, filtrar e excluir um registro.

## Banco esperado

A tabela `clientes` deve possuir as colunas já utilizadas pelo dashboard:

`id`, `nome`, `empresa`, `categoria`, `cidade`, `estado`, `status`, `destaque`, `ordem`.

As políticas RLS de `INSERT`, `UPDATE` e `DELETE` para a usuária autenticada precisam permanecer ativas.
