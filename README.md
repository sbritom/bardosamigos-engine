# Bar dos Amigos — Projeto Oficial

Este repositório é a **única fonte oficial do portal Bar dos Amigos**.

- Site: https://www.radiobardosamigos.com.br
- Domínio alternativo: https://radiobardosamigos.com.br
- Repositório oficial: `sbritom/bardosamigos-engine`
- Branch de produção: `main`
- Projeto Vercel oficial: `radio-bar-dos-amigos`
- Frontend: React + Vite
- Backend de dados/autenticação: Supabase
- APIs web/cron: Vercel Functions
- Engine de rádio: Node.js em `server/`

> **Regra de arquitetura:** não criar outra aplicação Vite/React dentro deste repositório e não manter cópias `.backup` versionadas. O histórico do Git é o backup oficial.

## Estrutura oficial

```text
/
├─ api/                 # Funções/API executadas na Vercel
├─ config/              # Configurações compartilhadas
├─ docs/                # Documentação técnica
├─ public/              # Assets públicos
├─ scripts/             # Build, SEO, sincronizações e utilitários
├─ server/              # Engine/backend da rádio
├─ src/                 # Aplicação web oficial
│  ├─ apps/portal/      # Shell, Home, layout e roteamento
│  ├─ apps/radio/       # Experiência de rádio atualmente ligada às rotas
│  ├─ core/             # Auth, banco, providers, registry e serviços centrais
│  ├─ design-system/    # Componentes e tokens visuais
│  ├─ modules/          # TV, futebol, eventos, BarCoins, chat, etc.
│  └─ shared/           # Componentes/utilitários compartilhados
├─ supabase/            # Migrations e seed do banco
├─ tests/portal/        # Testes automatizados do portal
├─ index.html           # Entrada única do frontend
├─ package.json         # Dependências/scripts únicos do projeto
├─ vercel.json          # Rotas, headers, cron e deploy
└─ vite.config.js       # Configuração única do Vite
```

## Rotas e módulos principais

O registro de rotas oficial está em `src/core/registry/plugins.jsx`.

Áreas públicas principais:
- Home
- TV
- Rádio
- Futebol
- Notícias
- BarStudio/Ferramentas
- Brincadeiras
- Comunidade
- BarCoins
- Eventos
- Manual
- Chat
- Palpites, Meus Palpites e Ranking
- Perfil, Para Você e Configurações

Áreas administrativas protegidas:
- `/admin`
- TV Manager
- Competition Admin
- Eventos Admin
- Rádio Admin

## Qualidade

Antes de publicar mudanças importantes:

```bash
npm ci
npm run portal:test
npm run build
npm run portal:release-smoke
npm run portal:budget
```

O workflow `.github/workflows/portal-quality.yml` executa essas verificações em pushes/PRs para `main`.

## Convenções

1. `main` é a branch de produção.
2. Nenhum segundo frontend deve ser criado dentro do repositório.
3. Backups de código não devem ser commitados; use o histórico do Git.
4. Segredos ficam somente em variáveis de ambiente.
5. O navegador pode receber apenas chaves públicas/anon do Supabase; nunca `service_role`.
6. Rotas administrativas devem usar os guards oficiais e autorização server-side/RLS.
7. Alterações de banco devem permanecer rastreáveis por migrations em `supabase/migrations/`.
