# Bar Competition Engine

## Objetivo

O Bar Competition Engine Core e o nucleo generico para gerenciar competicoes na plataforma Bar dos Amigos Engine. Ele foi criado para suportar futuramente futebol, basquete, volei, Formula 1, UFC, eSports, reality shows e outros eventos competitivos.

Nesta fase, o modulo nao cria interface, banco, Supabase, SQL, React ou componentes visuais.

## Arquitetura

```text
src/modules/competition/
  core/
  domain/
  services/
  repositories/
  validators/
  constants/
  types/
  utils/
  docs/
  index.js
```

## Responsabilidades

- Modelar competicoes, temporadas, etapas, rodadas e partidas.
- Registrar previsoes de usuarios sem persistencia externa.
- Calcular pontuacao por regras configuraveis.
- Gerar rankings a partir de previsoes pontuadas.
- Declarar conquistas e recompensas futuras.
- Manter o dominio desacoplado de telas, rotas e banco de dados.

## Entidades

- `Competition`
- `Season`
- `Stage`
- `Round`
- `Match`
- `Prediction`
- `ScoreRule`
- `Ranking`
- `Achievement`
- `Reward`

Todas possuem factory em `domain/` e contratos JSDoc em `types/`.

## Services

- `CompetitionService`: cria e lista competicoes, temporadas, etapas, rodadas e partidas.
- `PredictionService`: cria e lista previsoes com validacao de elegibilidade e janela de envio.
- `RankingService`: gera e salva rankings em memoria.
- `RewardService`: prepara recompensas e conquistas.
- `ScoringService`: calcula pontuacao e detalha acertos.

## Validators

- `CompetitionValidator`
- `MatchValidator`
- `PredictionValidator`

## Utilitarios

- `scoreCalculator`
- `rankingCalculator`
- `predictionAnalyzer`
- `matchResultResolver`

## Integracoes futuras

O core esta preparado, mas ainda nao integrado, com:

- BarAI: analises, resumos e insights de competicoes.
- BarCoins: recompensas e economia interna.
- Perfil: historico e elegibilidade de usuarios.
- Loja: resgate de recompensas.
- Rankings: exibicao e sincronizacao de classificacoes globais.

Todas as integracoes permanecem desabilitadas nesta fase.

## Uso basico

```js
import { barCompetitionEngineCore } from './src/modules/competition'

const result = barCompetitionEngineCore.competitionService.createCompetition({
  name: 'Campeonato do Bar',
  type: 'football',
})
```

## Fora do escopo desta fase

- Interface.
- Banco de dados.
- Supabase.
- SQL.
- Paginas React.
- Componentes visuais.
- Integracao com modulos existentes.
