# Bar Streaming Engine - Sprint 6B

## Objetivo

A Sprint 6B habilita a primeira transmissao real da Bar Streaming Engine pelo backend, sem alterar React, paginas, Dashboard, Player ou Biblioteca visual.

O fluxo operacional e:

1. RadioEngine inicializa configuracao, logger, biblioteca, playlist, scheduler, history, now playing, AutoDJ e API.
2. StreamEngine inicia o loop de transmissao.
3. AutoDJ seleciona uma musica da biblioteca.
4. AudioPipeline abre a musica e prepara o estado de transmissao.
5. FFmpegEngine executa o FFmpeg do sistema.
6. IcecastClient abre a conexao SOURCE com o Icecast.
7. Metadata e enviada ao Icecast.
8. Now Playing e History sao atualizados no inicio da reproducao.
9. Ao terminar, a proxima musica e selecionada.
10. Em falhas, Recovery registra erro, tenta reconectar e pula para a proxima musica.

## Como iniciar a radio

Instale e inicie Icecast e FFmpeg antes da transmissao real:

```bash
npm run validate-stream
npm run stream
```

Com a engine rodando e o Icecast ativo, o stream fica disponivel em:

```text
http://localhost:8000/radio
```

Para testar somente a inicializacao da engine sem depender do Icecast:

```bash
STREAM_DRY_RUN=true RADIO_EXIT_AFTER_START=true npm run stream
```

No Windows PowerShell:

```powershell
$env:STREAM_DRY_RUN="true"
$env:RADIO_EXIT_AFTER_START="true"
npm run stream
```

## Como parar

Use `Ctrl+C` no processo da engine. O shutdown chama `engine.stop()`, encerra o pipeline, desconecta do Icecast e fecha a API.

## Pasta de musicas

A pasta padrao e:

```text
server/radio/music
```

Para alterar:

```powershell
$env:RADIO_MUSIC_FOLDER="D:\Musicas\Radio"
npm run stream
```

## Bitrate e audio

Configure em `config/audio.json` ou por variaveis:

```json
{
  "sampleRate": 44100,
  "channels": 2,
  "bitrate": "128k",
  "codec": "libmp3lame",
  "format": "mp3",
  "contentType": "audio/mpeg"
}
```

Variaveis suportadas:

- `AUDIO_BITRATE`
- `AUDIO_SAMPLE_RATE`
- `AUDIO_CHANNELS`
- `AUDIO_CODEC`
- `AUDIO_FORMAT`

## Mount, porta e Icecast

Configure em `config/icecast.json`:

```json
{
  "host": "localhost",
  "port": 8000,
  "mount": "/radio",
  "username": "source",
  "password": "hackme",
  "adminUser": "admin",
  "adminPassword": "admin"
}
```

Variaveis suportadas:

- `ICECAST_HOST`
- `ICECAST_PORT`
- `ICECAST_MOUNT`
- `ICECAST_USER`
- `ICECAST_PASSWORD`
- `ICECAST_ADMIN_USER`
- `ICECAST_ADMIN_PASSWORD`

## Logs

Logs criados em `server/logs`:

- `engine.log`
- `stream.log`
- `ffmpeg.log`
- `icecast.log`
- `recovery.log`
- `history.log`
- `api.log`

## API real

Endpoints principais:

- `GET /engine/status`
- `GET /engine/nowplaying`
- `GET /engine/history`
- `GET /engine/stream`
- `GET /engine/audio`
- `GET /engine/icecast`

## Validacao

```bash
npm run validate-stream
npm run radio:test
npm run stream:test
npm run build
```

`npm run validate-stream` valida arquivos de configuracao, pastas, FFmpeg e Icecast. Se FFmpeg ou Icecast nao estiverem instalados/iniciados, a validacao aponta a pendencia e retorna erro.

## Pendencias para Sprint 7

- Upload real de musicas.
- Persistencia de biblioteca e historico.
- Administracao da fila pelo painel.
- Monitoramento de ouvintes reais.
- UI administrativa para encoder e Icecast.
- Observabilidade com metricas historicas.
