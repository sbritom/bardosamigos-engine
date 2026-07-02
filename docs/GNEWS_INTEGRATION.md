# GNews Sync v1.0

Integracao oficial da API GNews ao Sync Engine.

## Regra Principal

Componentes React nao consomem GNews diretamente.

Fluxo:

GNews -> Sync Engine -> Supabase -> Home / Noticias

## Variavel de Ambiente

- `VITE_GNEWS_API_KEY`

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

Se GNews estiver indisponivel, o service consulta noticias ja sincronizadas no Supabase. A Home mantem fallback local para nao ficar vazia em ambiente sem Supabase.

## Execucao Manual

```bash
npm run sync:gnews
```

## Proximos Passos

1. Executar em runtime server-side com `VITE_GNEWS_API_KEY`.
2. Criar agendamento periodico.
3. Adicionar upsert por URL original/slug quando constraints estiverem definidas.
4. Evoluir painel admin de sincronizacao com historico completo.
