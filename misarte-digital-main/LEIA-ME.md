# MisArte Admin v1.0

## Instalação

1. Abra a pasta local `misarte-digital`.
2. Copie a pasta `admin` deste pacote para dentro dela.
3. Confirme que a estrutura ficou:

```text
misarte-digital/
├── index.html
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── assets/
│   ├── css/
│   └── js/
└── ...
```

4. No GitHub Desktop:
   - Summary: `Adiciona painel administrativo MisArte`
   - Clique em `Commit to main`
   - Clique em `Push origin`

5. Depois da publicação, acesse:

```text
https://misarte-lab.github.io/misarte-digital/admin/login.html
```

## O que já funciona

- Login com Supabase Auth
- Sessão persistente
- Proteção do dashboard
- Redirecionamento para o login
- Logout
- Saudação “Olá, Mis 👋”
- Contadores do painel
- Listagem dos clientes da tabela `clientes`
- Layout responsivo

## Antes do primeiro acesso

No Supabase, confirme que o usuário `miscristiane@gmail.com` existe em:

Authentication → Users

A senha é a senha cadastrada nesse usuário.
