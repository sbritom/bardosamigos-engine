# Bar Streaming Engine - Sprint 3.5

## Objetivo

Validar e tornar operacional a logica interna da Bar Streaming Engine, sem Icecast, FFmpeg, streaming, upload, Supabase, frontend ou Player HTML.

## Entregas

- Library Engine real com leitura recursiva de `server/radio/music` por padrao.
- Cache em memoria com buscas por ID, artista, album, genero, categoria, titulo, search e random.
- Metadata real sem dependencia externa: hash, ID unico, path, extensao, tamanho, categoria por pasta, codec por extensao e titulo/artista a partir do nome do arquivo.
- Playlist Engine completa com next, previous, peek, queue, shuffle, repeat, clear, reset e history.
- Queue dinamica com adicionar, remover, mover, prioridade e proxima musica.
- Shuffle inteligente evitando musica, artista, album e categoria consecutivos quando possivel.
- AutoDJ logico completo sem tocar audio.
- Now Playing real com ID, titulo, artista, album, categoria, inicio, fim e tempo restante.
- History real das ultimas 100 musicas com ultima, penultima, pesquisar e limpar.
- Scheduler com agenda diaria, semanal, eventos e datas especiais.
- Event Bus com historico interno de eventos.
- Logger com arquivos separados.
- API com endpoints reais da Engine.
- Testes internos.

## Endpoints

- `GET /engine/status`
- `GET /engine/library`
- `GET /engine/history`
- `GET /engine/queue`
- `GET /engine/nowplaying`
- `GET /engine/config`

## Rodar

```bash
npm run radio
```

## Testes

```bash
npm run radio:test
```

## Pendencias Sprint 4

- Icecast.
- FFmpeg.
- Streaming real.
- Upload.
- Supabase.
- Storage.
- Parser de metadata com biblioteca especializada quando a dependencia for aprovada.
