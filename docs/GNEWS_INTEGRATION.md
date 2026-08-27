# GNews Sync v2.0

Sistema economico e persistente de noticias do portal Bar dos Amigos.

## Arquitetura

Visitantes nao chamam mais a GNews.

Fluxo oficial:

```text
Vercel Cron
-> /api/cron/sync-news
-> GNews
-> normalizacao e deduplicacao
-> Supabase public.news_articles
-> /api/news
-> Home e /news
```

## Horarios

A Vercel Cron usa UTC.

- 08:00 em Brasilia: `0 11 * * *`
- 18:00 em Brasilia: `0 21 * * *`

## Variaveis Necessarias

Server-side:

- `GNEWS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Nao usar em frontend:

- `VITE_GNEWS_API_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Endpoint De Sincronizacao

Endpoint:

```text
/api/cron/sync-news
```

Metodos:

- `GET`
- `POST`

Autorizacao:

- Vercel Cron com headers validos; ou
- `Authorization: Bearer <CRON_SECRET>`

Resposta:

```json
{
  "ok": true,
  "data": {
    "fetched": 20,
    "inserted": 12,
    "updated": 4,
    "skipped": 4,
    "cleanup": { "softDeleted": 0 },
    "errors": []
  }
}
```

## Topicos

Cada sincronizacao consulta no maximo quatro topicos:

- Brasil: `brasil`
- Esportes: `futebol OR esportes`
- Entretenimento: `entretenimento`
- Tecnologia: `tecnologia`

Durante a janela da Copa do Mundo FIFA 2026, o topico Esportes usa:

```text
"Copa do Mundo" OR futebol OR esportes
```

## Persistencia

Tabela principal:

- `public.news_articles`

Categorias:

- `public.news_categories`

Logs:

- `public.analytics_events`

Campos relevantes em `metadata`:

- `provider`
- `category`
- `source`
- `sourceUrl`
- `originalUrl`
- `relevanceScore`
- `syncedAt`

## Deduplicacao

A sincronizacao evita duplicatas por:

1. URL original normalizada;
2. `slug`.

Quando uma noticia ja existe, os dados relevantes sao atualizados em vez de criar novo registro.

## Limpeza

Apos uma sincronizacao com conteudo novo valido, o sistema mantem ate 50 noticias publicadas por categoria.

Noticias excedentes recebem soft delete por `deleted_at`.

Se a GNews falhar, a limpeza nao remove as ultimas noticias validas.

## /api/news

`/api/news` nao chama mais a GNews.

Ele le somente o cache persistente no Supabase e preserva o formato consumido pela Home e pela pagina `/news`:

```json
{
  "source": "supabase-cache",
  "articles": [],
  "categories": [],
  "errors": []
}
```

Cache HTTP:

```text
s-maxage=300
stale-while-revalidate=120
```

## Execucao Manual Segura

Apos deploy, execute uma sincronizacao manual com:

```bash
curl -X POST "https://SEU_DOMINIO/api/cron/sync-news" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Localmente, com variaveis server-side configuradas:

```bash
npm run sync:gnews
```

## Consumo Estimado

- 4 chamadas GNews por sincronizacao.
- 8 chamadas GNews por dia.
- Aproximadamente 240 chamadas por mes.

O limite exato depende do plano contratado na GNews.

## Falhas

Se a GNews atingir limite, ficar offline ou retornar erro:

- a sincronizacao registra o erro;
- as ultimas noticias validas continuam no Supabase;
- `/api/news` continua lendo o cache persistente;
- visitantes nao consomem cota da GNews.
