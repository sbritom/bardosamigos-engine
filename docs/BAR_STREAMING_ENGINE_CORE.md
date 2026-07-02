# Bar Streaming Engine Core

## Objetivo

A Sprint 3 cria o core independente da Bar Radio. O frontend nao depende diretamente desta Engine. A Engine roda em Node, carrega a biblioteca local, cria playlist, prepara AutoDJ, Scheduler, historico, Now Playing, logger e API.

## Arquitetura

```text
server/src/
  core/
    RadioEngine.js
  config/
    ConfigEngine.js
  library/
    LibraryEngine.js
    MetadataReader.js
    PlaylistEngine.js
  player/
    PlayerEngine.js
    NowPlayingEngine.js
  autodj/
    AutoDJEngine.js
  scheduler/
    SchedulerEngine.js
  history/
    HistoryEngine.js
  logger/
    LoggerEngine.js
  events/
    EventBus.js
  api/
    ApiEngine.js
  utils/
```

## Fluxo de inicializacao

1. Carregar Config.
2. Inicializar Logger.
3. Inicializar Biblioteca.
4. Inicializar Playlist.
5. Inicializar Scheduler.
6. Inicializar AutoDJ.
7. Inicializar History.
8. Inicializar Now Playing.
9. Inicializar API.
10. Sistema pronto aguardando Streaming.

## ConfigEngine

Campos principais:

- `radioName`
- `radioSlogan`
- `musicFolder`
- `playlistFolder`
- `logFolder`
- `historyLimit`
- `crossfade`
- `fadeIn`
- `fadeOut`
- `shuffle`
- `autoDJ`

## LibraryEngine

Le arquivos em `server/music` por padrao e cria indice em memoria para:

- mp3
- aac
- ogg
- wav
- flac

Metadata real fica preparada por estrutura, sem dependencias externas nesta Sprint.

## PlayerEngine

Maquina de estados:

- `STOPPED`
- `PLAYING`
- `PAUSED`
- `BUFFERING`
- `LOADING`
- `ERROR`

## Event Bus

Eventos internos:

- `musicStarted`
- `musicFinished`
- `playlistChanged`
- `configChanged`
- `engineStarted`
- `engineStopped`

## API

Endpoints:

- `GET /engine/status`
- `GET /engine/library`
- `GET /engine/history`
- `GET /engine/nowplaying`
- `GET /engine/config`

Tambem foram preservados endpoints `/api/radio/*` para compatibilidade com a Sprint 2.

## Rodar

```bash
npm run radio
```

Para teste rapido sem deixar o servidor ativo:

```bash
RADIO_EXIT_AFTER_START=true npm run radio
```

No PowerShell:

```powershell
$env:RADIO_EXIT_AFTER_START='true'; npm run radio
```

## Fora do escopo

- Icecast
- FFmpeg
- Streaming
- Upload
- Supabase
- Storage
- Player HTML
- Frontend

## Pendencias Sprint 3.5

- Parser real de metadata com biblioteca especializada.
- Persistencia de historico/logs em banco ou arquivos rotacionados.
- Loader real de playlists em disco.
- Scheduler com execucao temporal.
- Adaptadores Icecast/Shoutcast.
- Testes automatizados do core.
