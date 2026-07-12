# GNews Sync v1.0

Integracao oficial da API GNews ao Sync Engine.

## Regra Principal

Componentes React nao consomem GNews diretamente.

Fluxo:

GNews -> Sync Engine -> Supabase -> Home / Noticias

## Variavel de Ambiente

- `GNEWS_API_KEY` para o fallback server-side `/api/news`
- `VITE_GNEWS_API_KEY` legado para rotinas antigas de sync no frontend/admin

O valor da chave nao deve ser salvo no repositorio nem exibido em componentes React.

## Endpoint Utilizado

Base URL:

- `https://gnews.io/api/v4`

Endpoint:

- `GET /search`

Parametros preparados:

- `q`
- `lang=pt`
- `country=br`
- `max`
- `apikey`

## Categorias Sincronizadas

- Futebol
- Esportes
- Brasil

## Campos Persistidos

- titulo
- descricao
- imagem
- fonte
- URL original
- categoria
- data de publicacao

## Fallback

Home e Noticias consultam o Supabase como fonte principal. Se o Supabase falhar, estiver vazio ou retornar apenas noticias antigas, a Home usa o endpoint server-side `/api/news`, que consulta GNews com `process.env.GNEWS_API_KEY` sem expor chave no frontend.

O fallback server-side busca conteudo em portugues do Brasil para Brasil, futebol/esportes, entretenimento e tecnologia. Durante a Copa do Mundo FIFA 2026, noticias da Copa recebem prioridade adicional sem ocupar todo o feed.

## Execucao Manual

```bash
npm run sync:gnews
```

## Proximos Passos

1. Migrar rotinas antigas de sincronizacao manual para `GNEWS_API_KEY` server-side.
2. Criar agendamento periodico.
3. Adicionar upsert por URL original/slug quando constraints estiverem definidas.
4. Evoluir painel admin de sincronizacao com historico completo.
