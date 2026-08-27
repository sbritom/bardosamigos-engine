# Auditoria Geral — Projeto Oficial Bar dos Amigos

Data da auditoria: 27/08/2026

## 1. Fonte oficial

A única fonte oficial do portal é:

- Repositório: `sbritom/bardosamigos-engine`
- Branch de produção: `main`
- Vercel: `radio-bar-dos-amigos`
- Domínio principal: `https://www.radiobardosamigos.com.br`
- Backend de dados/autenticação: Supabase `BarDosAmigos`

O antigo repositório `sbritom/bardosamigos` foi descontinuado e reduzido a uma página de migração com redirect permanente para o domínio oficial. Ele não contém mais a aplicação React, admin ou catálogo de TV.

## 2. Consolidação executada

### Estrutura

Foram removidos do projeto oficial:

- segunda aplicação Vite/React aninhada em `bardosamigos-engine/`;
- backups versionados em `.codex/backups/`;
- arquivos `.backup` do frontend;
- backups duplicados do `ApiEngine`;
- credenciais e senhas padrão versionadas;
- tabela legada `public.canais_tv`.

O Git passa a ser o mecanismo oficial de histórico e rollback; não devem existir cópias `.backup` dentro do repositório.

### Banco de TV

A fonte única do catálogo é:

- `tv_channels`: catálogo oficial;
- `tv_categories`: categorias;
- `tv_featured`: destaques;
- `tv_favorites`: favoritos;
- `tv_recent`: histórico recente;
- `tv_channel_candidates`: fila de canais para revisão.

A tabela `canais_tv` foi retirada. Antes disso, FIFA TV, GE TV e Lofi Girl foram preservados na fila de candidatos como `pending/unverified`.

Estado após consolidação:

- `tv_channels`: 109 registros;
- `tv_channel_candidates`: 477 registros;
- `canais_tv`: inexistente.

## 3. Estrutura oficial

```text
/
├─ api/                 # Vercel Functions
├─ config/              # Configurações da engine
├─ docs/                # Documentação
├─ public/              # Assets públicos e SEO
├─ scripts/             # Build, SEO, seeds e manutenção
├─ server/              # Engine Node da rádio
├─ src/                 # Aplicação React/Vite
│  ├─ apps/portal/      # Shell, Home e roteamento
│  ├─ apps/radio/       # Rádio pública e painel do locutor ativos
│  ├─ core/             # Auth, database, registry, providers
│  ├─ design-system/    # Componentes/tokens visuais
│  ├─ modules/          # TV, futebol, notícias, eventos, etc.
│  └─ shared/           # Código compartilhado
├─ supabase/            # Migrations
└─ tests/portal/        # Testes automatizados
```

A fonte de verdade das rotas é `src/core/registry/plugins.jsx`.

## 4. Funcionalidades existentes

### Portal

- Home;
- navegação SPA;
- SEO por rota;
- PWA/manifest;
- design system;
- páginas de erro e fallback;
- lazy loading de módulos.

### TV

- catálogo por categorias;
- busca;
- filtros;
- destaques;
- favoritos;
- recentes;
- disponibilidade regional;
- YouTube oficial;
- iframe controlado;
- HLS oficial;
- player HLS nativo/Safari;
- fallback com `hls.js/light`;
- allowlist de hosts HLS;
- TV Manager administrativo;
- CRUD de canais;
- CRUD de categorias;
- destaques;
- ordenação;
- status habilitado/desabilitado;
- métricas administrativas;
- fila com centenas de candidatos para revisão.

Pendente no módulo TV: a tela de importação ainda é placeholder e o processo de validação/ativação em massa precisa ser concluído.

### Rádio

- stream público MxCast;
- play/pause;
- volume;
- música atual;
- capa;
- ouvintes;
- atualização periódica de metadados;
- pedido de música público;
- limitação de frequência de pedidos;
- painel do locutor;
- leitura/marcação/exclusão de pedidos;
- papéis `admin` e `locutor`;
- engine Node separada com biblioteca, AutoDJ, playlist, scheduler, FFmpeg, Icecast, histórico, covers, audience, Xat e health.

### Futebol e competição

- central de futebol;
- jogos;
- detalhes da partida;
- páginas de times;
- campeonatos;
- temporadas;
- rodadas;
- times;
- partidas;
- resultados;
- palpites;
- meus palpites;
- ranking.

### Notícias

- API de notícias;
- cache no Supabase;
- sincronização agendada via cron;
- página de notícias;
- tolerância a falhas/cache.

### Eventos

- listagem pública;
- área administrativa;
- criação e atualização;
- validação de campos;
- status draft/published;
- eventos recorrentes;
- autorização administrativa server-side.

### Comunidade e conta

- perfis;
- página da comunidade;
- visibilidade voluntária na comunidade;
- página “Para Você”;
- configurações;
- overview público seguro;
- autenticação Supabase.

### Outros módulos

- BarCoins;
- BarStudio;
- Designer Pro;
- Chat;
- Brincadeiras;
- Manual;
- Xat;
- personalização;
- infraestrutura de bolão/competição.

Alguns desses módulos ainda possuem partes em estágio de infraestrutura/MVP e precisam de validação funcional completa antes de serem considerados finalizados.

## 5. Administração e autenticação

O portal possui um guard administrativo central em `src/core/auth/AdminRouteGuard.jsx`.

Pontos positivos:

- login por usuário/senha via Supabase;
- sessão revalidada por `auth.getUser()`;
- não confia apenas no token salvo localmente;
- autorização por `app_metadata`;
- usuário comum não recebe privilégio administrativo;
- administrador pode acessar todos os módulos administrativos;
- locutor é restrito ao módulo de rádio;
- rotas administrativas são `noindex,nofollow`.

Rotas administrativas principais:

- `/admin`;
- `/admin/tv/*`;
- `/admin/competition/*`;
- `/events/admin`;
- `/radio/admin`.

Débito técnico: o Radio Admin ainda contém uma camada própria de login além do guard global. Deve ser unificado para existir uma única experiência de autenticação administrativa.

## 6. Segurança — estado atual

### Corrigido nesta auditoria

- removidas credenciais Icecast do código atual;
- removidos defaults inseguros como senhas de demonstração;
- Docker agora exige senhas por ambiente;
- criado `.env.example` sem segredos;
- `.env*` protegido pelo `.gitignore`;
- nenhuma chave `service_role` é destinada ao frontend;
- antigo projeto deixou de servir código do portal;
- todas as 57 tabelas públicas do Supabase estão com RLS habilitado;
- HLS exige HTTPS e hosts aprovados;
- endpoints Vercel administrativos validam sessão/role em áreas importantes;
- HSTS, nosniff, referrer-policy e permissions-policy estão ativos na Vercel.

### P0 — precisa de correção prioritária

1. **Rotação de credencial já exposta no histórico Git**
   - Uma credencial Icecast esteve versionada no repositório público.
   - Ela foi removida do HEAD, mas continua no histórico.
   - Qualquer servidor que tenha usado essa credencial deve receber uma nova senha.
   - Se for possível reescrever o histórico futuramente, isso complementa a rotação, mas não substitui a troca da credencial.

2. **API interna da Radio Engine**
   - `server/src/api/ApiEngine.js` expõe endpoints administrativos e `/engine/restart`.
   - Hoje não há autenticação própria nesses endpoints.
   - No Docker atual a porta da engine não é publicada, o que reduz a exposição, mas executar/publicar a porta diretamente criaria risco.
   - Implementar bearer token interno, proxy autenticado ou bind exclusivamente privado.

3. **Branch `main` sem proteção obrigatória**
   - O workflow Portal Quality existe e está passando.
   - Porém `main` ainda aceita push direto sem exigir o status do CI.
   - Ativar branch protection, bloquear force-push e exigir o workflow de qualidade.

### P1 — segurança/endurecimento

- habilitar proteção contra senhas vazadas no Supabase Auth;
- revisar `admin_recovery_codes`: RLS está ativo e sem policies; confirmar formalmente que o acesso é somente service role;
- criar CSP compatível com YouTube, HLS, Xat e demais embeds;
- revisar CORS da engine Node, que atualmente usa `Access-Control-Allow-Origin: *`;
- atualizar allowlist antiga de origem em APIs para o domínio `radiobardosamigos.com.br`;
- endurecer cron para preferir `CRON_SECRET` obrigatório;
- ativar secret scanning/push protection no GitHub, quando disponível;
- adicionar auditoria de dependências ao CI.

## 7. Supabase — saúde e performance

Resultado dos advisors no momento da auditoria:

- 57 tabelas públicas;
- 57 com RLS habilitado;
- 0 tabelas públicas com RLS desabilitado;
- 2 avisos de segurança;
- 142 avisos de performance.

Performance:

- 35 foreign keys sem índice;
- 33 policies com `auth.*` que podem ser otimizadas para init plan;
- 24 índices atualmente não utilizados;
- 50 casos de múltiplas policies permissivas.

Isso não significa 142 vulnerabilidades. A maioria é débito de performance e manutenção de RLS, mas deve ser corrigida por migrations pequenas e testadas.

Prioridade recomendada:

1. perfis e autenticação;
2. TV;
3. competição/palpites;
4. BarCoins;
5. eventos;
6. pedidos da rádio;
7. tabelas menos acessadas.

## 8. Código e duplicidades restantes

A grande duplicidade estrutural foi removida. Ainda existem débitos que não devem ser apagados sem refatoração:

### Rádio

Existem duas camadas históricas:

- `src/apps/radio/`: experiência realmente usada pelas rotas;
- `src/modules/radio/`: engine/UI protótipo com mocks e serviços que ainda fornece algumas configurações compartilhadas.

A solução correta não é apagar a pasta inteira. Primeiro devemos mover dependências úteis para a área ativa e depois remover a UI/mock legado.

### Arquivos placeholder

Existem 16 arquivos vazios, principalmente em `src/core`, `src/engine` e `src/shared/layout`.

Eles não quebram o build, mas devem ser classificados em:

- implementar;
- remover;
- substituir por módulos reais.

## 9. Qualidade e deploy

Workflow: `Portal Quality`

Executa:

- instalação limpa;
- testes do portal;
- build de produção;
- release smoke;
- performance budget.

Os commits da consolidação passaram no workflow.

Deploy oficial mais recente na data desta auditoria:

- Vercel: `radio-bar-dos-amigos`;
- branch: `main`;
- estado: READY;
- `/`: HTTP 200;
- `/admin`: HTTP 200;
- `/tv`: HTTP 200.

O antigo projeto Vercel `bardosamigos` agora executa redirect permanente para o site oficial.

## 10. Principais falhas encontradas

| Prioridade | Falha | Estado |
|---|---|---|
| P0 | Dois projetos competindo pelo mesmo produto | Corrigido/neutralizado |
| P0 | Segunda aplicação Vite dentro do repo oficial | Corrigido |
| P0 | Backups versionados confundindo fonte oficial | Corrigido |
| P0 | Credencial Icecast no código atual | Removida; rotação ainda necessária |
| P0 | Senhas padrão na engine/Docker | Corrigido |
| P0 | API administrativa da engine sem auth própria | Pendente |
| P0 | Branch main sem proteção obrigatória | Pendente |
| P1 | Tabela TV legada `canais_tv` | Corrigido |
| P1 | Duas camadas de rádio frontend | Pendente refatoração |
| P1 | Login duplicado no Radio Admin | Pendente |
| P1 | 142 advisors de performance Supabase | Pendente em lotes |
| P1 | Proteção de senha vazada desativada | Pendente |
| P1 | CSP ausente | Pendente |
| P2 | TV Import ainda placeholder | Pendente |
| P2 | 16 arquivos placeholder vazios | Classificar |
| P2 | CI sem auditoria de dependências | Pendente |

## 11. Roadmap recomendado

### Fase 1 — segurança e governança

- rotacionar a credencial Icecast antiga;
- proteger endpoints internos da engine;
- configurar branch protection;
- secret scanning;
- leaked-password protection;
- revisar CORS/CSP;
- adicionar dependency audit.

### Fase 2 — arquitetura

- fundir `src/apps/radio` e dependências úteis de `src/modules/radio`;
- unificar login/admin;
- remover placeholders realmente mortos;
- centralizar contratos/API do rádio;
- revisar aliases/rotas antigas.

### Fase 3 — banco

- otimizar foreign keys;
- consolidar policies permissivas;
- otimizar `auth.uid()`/RLS;
- revisar índices sem uso;
- criar migrations por domínio, com teste antes/depois.

### Fase 4 — TV

- concluir TV Import;
- criar fluxo de aprovação da fila `tv_channel_candidates`;
- health check de HLS;
- teste CORS/manifest automático;
- histórico de disponibilidade;
- ativação somente após validação;
- painel para fonte principal/fallback.

### Fase 5 — rádio

- autenticação da engine;
- painel operacional real de AutoDJ;
- biblioteca/playlist/scheduler em produção;
- métricas e observabilidade;
- fila de pedidos integrada ao painel;
- roles de locutor centralizadas.

### Fase 6 — produto

- evoluir BarCoins;
- consolidar missões/loja/recompensas;
- aprimorar comunidade/perfis;
- personalização “Para Você”;
- melhorar chat;
- ampliar BarStudio;
- revisar brincadeiras e ranking;
- observabilidade geral e alertas.

## 12. Regra daqui em diante

Toda alteração do portal deve partir exclusivamente de:

`sbritom/bardosamigos-engine@main`

Não criar segundo frontend, segundo repositório de produção, segundo catálogo de TV ou autenticação paralela sem uma decisão arquitetural explícita.
