# Supabase Architecture

## Objetivo

A Fase 6 implementa a camada completa de persistencia do Bar dos Amigos Engine em Supabase/PostgreSQL, baseada na arquitetura de banco definida anteriormente.

Esta fase nao altera telas, rotas, layout ou regras de negocio existentes. A camada foi criada para consumo futuro.

## Estrutura criada

```text
supabase/
  migrations/
    20260619000100_initial_platform_schema.sql
    20260619000200_storage_buckets.sql
  seed.sql

src/core/database/
  client/
  constants/
  dtos/
  mappers/
  repositories/
  services/
  types/
  index.js
```

## Banco

A migration principal cria:

- extensoes PostgreSQL
- enums
- tabelas
- primary keys
- foreign keys
- constraints
- indices
- views publicas
- triggers
- funcoes PostgreSQL
- Row Level Security
- policies

Principais dominios cobertos:

- Perfil
- Administracao
- BarAI
- Bar Competition Engine
- BarCoins
- Loja
- Missoes
- Rankings
- TV
- Radio
- Noticias
- Eventos
- Auditoria
- Configuracoes
- Assets

## Relacionamentos

`profiles` e a identidade central e referencia `auth.users`.

Fluxos principais:

- `profiles -> profile_stats`
- `profiles -> barcoin_wallets -> barcoin_transactions`
- `competitions -> competition_seasons -> competition_stages -> competition_rounds -> competition_matches -> competition_predictions`
- `competition_rankings -> competition_ranking_items`
- `store_orders -> store_order_items -> store_products`
- `missions -> profile_missions`
- `ranking_boards -> ranking_entries`
- `news_categories -> news_articles -> news_interactions`
- `events -> event_registrations`
- `tv_channels -> tv_programs -> tv_watch_events`
- `radio_stations -> radio_tracks -> radio_listen_events`

## RLS

RLS foi habilitado nas tabelas de dominio e operacao.

Padroes usados:

- usuarios leem e atualizam seus proprios dados
- admins acessam dados administrativos via `public.is_admin()`
- conteudos publicados podem ser lidos publicamente
- dados financeiros sao lidos apenas pelo dono ou admin
- auditoria e administracao ficam restritas a admin
- palpites sao inseridos pelo proprio usuario
- updates de palpites sao limitados antes do lock

## Permissoes

Permissoes de aplicacao ficam preparadas em:

- `admin_roles`
- `admin_assignments`
- `feature_flags`
- `app_settings`

O controle fino de permissoes deve evoluir por policies e funcoes RPC seguras em fases futuras.

## Fluxo dos dados

1. Usuario autentica pelo Supabase Auth.
2. Trigger `handle_new_user` cria `profiles`, `profile_stats` e `barcoin_wallets`.
3. App consome dados por repositories em `src/core/database`.
4. Escritas relevantes geram auditoria por triggers.
5. Soft delete usa `deleted_at`.
6. Views publicas expõem somente conteudo publicado.

## Buckets

Buckets criados:

- `avatars`
- `media`
- `documents`
- `store-assets`
- `news-assets`

Buckets publicos permitem leitura publica. Upload exige usuario autenticado.

## Camada de codigo

`src/core/database/client/supabaseClient.js` cria um client browser usando apenas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nenhuma chave privada deve ser colocada no frontend.

Repositories:

- `baseRepository`
- `profileRepository`
- `competitionRepository`
- `barcoinRepository`
- `contentRepository`

Services:

- `profilePersistenceService`
- `competitionPersistenceService`
- `barcoinPersistenceService`
- `contentPersistenceService`

## Boas praticas

- Nunca usar service role no frontend.
- Criar RPCs seguras para operacoes financeiras e administrativas.
- Manter soft delete para dados de dominio.
- Nunca apagar transacoes financeiras ou auditoria.
- Consultas publicas devem filtrar `status = 'published'` e `deleted_at is null`.
- Indices JSONB devem ser adicionados apenas quando houver consulta real por chaves internas.
- Seeds devem ser idempotentes.

## Como aplicar as migrations

Com Supabase CLI configurado:

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase db seed
```

Para ambiente local:

```bash
supabase start
supabase db reset
```

`supabase db reset` recria o banco local e aplica migrations e seed.
