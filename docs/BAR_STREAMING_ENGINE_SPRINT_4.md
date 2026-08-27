# Bar Streaming Engine - Sprint 4

## Objetivo

Iniciar a arquitetura de transmissao real da radio no backend, sem alterar React, paginas, Dashboard, Player, Biblioteca ou interface.

## Criado

- `server/src/audio/AudioPipeline.js`
- `server/src/audio/AudioQueue.js`
- `server/src/audio/Encoder.js`
- `server/src/ffmpeg/FFmpegEngine.js`
- `server/src/icecast/IcecastClient.js`
- `server/src/stream/StreamEngine.js`
- `server/src/stream.js`
- `config/stream.json`
- `config/audio.json`
- `config/ffmpeg.json`
- `Dockerfile`
- `docker-compose.yml`

## Fluxo

Library -> Queue -> Decoder preparado -> FFmpeg -> Encoder -> Icecast.

## FFmpeg

O `FFmpegEngine` detecta automaticamente Windows, Linux e macOS. Tambem aceita caminho configurado em `config/ffmpeg.json` ou `FFMPEG_PATH`.

## Icecast

O `IcecastClient` suporta:

- conectar
- reconectar
- heartbeat
- troca de metadata
- atualizacao de titulo

## Modo real e dry-run

`config/stream.json` vem com `dryRun: true` para permitir testes sem Icecast/FFmpeg local. Para transmissao real:

1. Instalar FFmpeg no sistema ou configurar `FFMPEG_PATH`.
2. Subir Icecast.
3. Colocar arquivos em `server/radio/music`.
4. Alterar `dryRun` para `false`.
5. Rodar `npm run stream`.

## Endpoints novos

- `GET /engine/stream`
- `GET /engine/audio`
- `GET /engine/icecast`

## Testes

```bash
npm run stream:test
```

## Pendencias Sprint 5

- Upload.
- Supabase.
- Storage.
- Interface de controle operacional.
- Monitoramento avancado.
- Metadata real via parser especializado.
