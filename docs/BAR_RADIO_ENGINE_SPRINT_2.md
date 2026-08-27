# Bar Radio Engine - Sprint 2

## Objetivo

Transformar a Bar Radio Engine em uma radio funcional do ponto de vista de arquitetura, substituindo o acesso direto a mocks por services reais, API REST interna e backend Node preparado para producao.

## Escopo implementado

- `RadioEngine`
- `StreamingService`
- `LibraryService`
- `MetadataService`
- `PlaylistService`
- `ScheduleService`
- `AutoDJService`
- `NowPlayingService`
- `ConfigService`
- `ListenerService`
- `LoggerService`

## Backend

Estrutura:

```text
server/
  api/
  config/
  jobs/
  routes/
  services/
  src/
    api/
    config/
    jobs/
    services/
    utils/
  utils/
```

Rodar localmente:

```bash
node server/src/index.js
```

## Endpoints REST

- `GET /api/radio/status`
- `GET /api/radio/nowplaying`
- `GET /api/radio/history`
- `GET /api/radio/playlists`
- `GET /api/radio/categories`
- `GET /api/radio/library`
- `GET /api/radio/config`
- `GET /api/radio/listeners`
- `GET /api/radio/stats`
- `GET /api/radio/logs`
- `GET /api/radio/schedule`

## Configuracao

Variaveis preparadas:

- `RADIO_STREAM_URL`
- `RADIO_STATUS_URL`
- `RADIO_ADMIN_USER`
- `RADIO_ADMIN_PASSWORD`
- `AUTO_DJ_ENABLED`
- `RADIO_PROVIDER`
- `RADIO_SERVER_PORT`
- `VITE_RADIO_API_BASE_URL`
- `VITE_RADIO_REFRESH_MS`

## Integracoes preparadas

- Icecast
- Shoutcast
- Streaming externo

## Fora do escopo

- Upload real
- Supabase
- Storage
- AutoDJ real
- Streaming real
- Icecast real

Esses itens ficam para a Sprint 3.
