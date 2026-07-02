# Bar Streaming Engine v2.0

## Objetivo

A v2.0 evolui a Bar Streaming Engine existente para uma engine de streaming real, modular e preparada para producao, sem recriar a radio e sem alterar interface visual.

## Fluxo

1. `RadioEngine` carrega configuracao, logs, biblioteca, playlist, fila, AutoDJ, historico, Now Playing e API.
2. `LibraryEngine` escaneia `server/radio/music` e subpastas.
3. `AutoDJEngine` seleciona a proxima musica respeitando regras basicas de repeticao.
4. `QueueEngine` gerencia fila dinamica e preload.
5. `AudioPipeline` prepara estados `Idle`, `Loading`, `Buffering`, `Streaming`, `Finished` e `Error`.
6. `FFmpegEngine` executa o FFmpeg do sistema.
7. FFmpeg envia o audio diretamente para `icecast://source:SENHA@HOST:PORT/radio`.
8. `IcecastClient` gerencia heartbeat, metadata e estado do mount.
9. `NowPlayingEngine` atualiza `currentTrack`, `elapsed`, `remaining`, `listeners`, `bitrate` e `streamState`.
10. `HistoryEngine` salva as ultimas 100 musicas.

## Configuracao

Arquivo principal de runtime:

```text
server/src/config/config.js
```

Variaveis suportadas:

- `RADIO_HOST`
- `RADIO_ENGINE_PORT`
- `ICECAST_HOST`
- `ICECAST_PORT`
- `ICECAST_PASSWORD`
- `ICECAST_MOUNT`
- `AUDIO_BITRATE`
- `AUDIO_SAMPLE_RATE`
- `AUDIO_CHANNELS`
- `AUTO_DJ_ENABLED`
- `RADIO_CROSSFADE`
- `RADIO_SHUFFLE`
- `LOG_LEVEL`
- `RADIO_MUSIC_FOLDER`
- `RADIO_CACHE_FOLDER`
- `RADIO_QUEUE_FOLDER`

## API

GET:

- `/engine/status`
- `/engine/history`
- `/engine/library`
- `/engine/queue`
- `/engine/now-playing`
- `/engine/health`

POST:

- `/engine/restart`

WebSocket:

- `/engine/ws`

Eventos emitidos:

- `trackChanged`
- `streamStarted`
- `streamStopped`
- `listenerUpdate`
- `metadataChanged`

## Comandos

```bash
npm run stream
npm run stream:test
npm run engine:test
npm run validate-stream
npm run build
```

## Requisitos para transmissao real

- Node 22.
- FFmpeg 8 ou compativel disponivel no PATH ou em `config/ffmpeg.json`.
- Icecast 2.5 ou compativel rodando.
- Mount configurado como `/radio`.
- Musicas reais em `server/radio/music`.

## Fallback de desenvolvimento

Use `STREAM_DRY_RUN=true` para validar a engine sem FFmpeg/Icecast:

```powershell
$env:STREAM_DRY_RUN="true"
npm run stream:test
npm run engine:test
```

## Pendencias futuras

- Extracao real de metadata ID3/FLAC sem depender somente do nome do arquivo.
- Crossfade real com filtros FFmpeg.
- Persistencia duravel de fila/historico.
- Leitura de ouvintes reais via admin API do Icecast.
- Painel administrativo de stream.
