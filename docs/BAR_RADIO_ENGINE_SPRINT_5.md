# Bar Radio Engine - Sprint 5

## Objetivo

Conectar o frontend da Radio ao backend real da Bar Streaming Engine sem recriar a radio, sem refazer a Engine e sem alterar Chat, TV ou BarCoins.

## Variaveis de ambiente

```env
VITE_RADIO_API_BASE_URL=http://localhost:3333
VITE_RADIO_STREAM_URL=http://localhost:8000/radio
VITE_RADIO_STATUS_URL=http://localhost:3333/engine/status
VITE_RADIO_USE_MOCKS=false
VITE_RADIO_POLLING_INTERVAL=5000
```

## Backend

Iniciar a Engine:

```bash
npm run stream
```

Em modo apenas API/core:

```bash
npm run radio
```

## Frontend

Iniciar o Vite:

```bash
npm run dev
```

A pagina `/radio` consome primeiro os endpoints reais:

- `GET /engine/status`
- `GET /engine/nowplaying`
- `GET /engine/history`
- `GET /engine/library`
- `GET /engine/config`
- `GET /engine/stream`
- `GET /engine/audio`
- `GET /engine/icecast`

Se a API estiver offline, os services usam fallback seguro para mocks e a interface continua carregada.

## Stream

O Player usa `VITE_RADIO_STREAM_URL` como prioridade. Se a URL estiver vazia ou offline, ele mostra status offline e preserva a interface.

## CORS

O backend atual libera CORS para desenvolvimento com `Access-Control-Allow-Origin: *`. Em producao, restringir para o dominio oficial do Bar dos Amigos.

## Testes

API offline:

1. Nao iniciar backend.
2. Rodar `npm run dev`.
3. Abrir `/radio`.
4. Confirmar carregamento com fallback.

API online:

1. Rodar `npm run radio` ou `npm run stream`.
2. Configurar `VITE_RADIO_API_BASE_URL`.
3. Rodar `npm run dev`.
4. Abrir `/radio`.

## Fora do escopo

- Upload real.
- Supabase Storage.
- Edicao real da biblioteca.
- Login novo.
- Aplicativo.
- Locucao IA.
