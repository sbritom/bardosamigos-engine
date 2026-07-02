# Football-Data v1.0

Integracao oficial preparada para sincronizar dados da Football-Data.org atraves do Sync Engine.

## Regra Principal

Componentes React nao devem chamar Football-Data.org diretamente.

Fluxo esperado:

Football-Data.org -> Sync Engine -> Supabase -> Competition/Home/Noticias

## Variavel de Ambiente

- `VITE_FOOTBALL_DATA_API_KEY`

Nenhum valor de chave deve ser salvo no repositorio. A execucao real da sincronizacao deve ocorrer em ambiente controlado, preferencialmente server-side, para evitar exposicao indevida.

## Endpoints Preparados

Base URL:

- `https://api.football-data.org/v4`

Endpoints:

- `GET /competitions`
- `GET /competitions/{competitionCode}/teams`
- `GET /competitions/{competitionCode}/matches?status=SCHEDULED`
- `GET /competitions/{competitionCode}/matches?status=FINISHED`
- `GET /competitions/{competitionCode}/standings`

## Estrutura

- Adapter: `src/core/sync/providers/footballData/footballDataAdapter.js`
- Service: `src/core/sync/providers/footballData/footballDataService.js`
- Repository: `src/core/sync/providers/footballData/footballDataRepository.js`
- Mapper: `src/core/sync/providers/footballData/footballDataMapper.js`
- Constants: `src/core/sync/providers/footballData/footballDataConstants.js`

## Dados Sincronizados

- Competicoes -> `competitions`
- Times -> `competition_teams`
- Proximos jogos -> `competition_matches`
- Jogos encerrados -> `competition_matches`
- Classificacao -> `ranking_entries` quando houver relacionamento interno disponivel

## Fallback

Quando a API falhar ou a chave nao estiver configurada, o service registra erro e tenta manter o consumo por dados ja sincronizados no Supabase.

## Proximos Passos

1. Criar job server-side para executar `syncEngine.sync('football-data', ...)`.
2. Definir mapeamento interno de `competitionCode`, `competitionId` e `roundId`.
3. Criar agendamento de sincronizacao periodica.
4. Finalizar tela admin para disparar sincronizacao manual.
5. Adicionar upsert por `external_ref` quando as constraints estiverem definidas no banco.
