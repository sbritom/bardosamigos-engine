# Bolao Pro Engine

## Objetivo

O Bolao Pro Engine contem apenas a camada de dominio do novo modulo Bolao Pro. Esta fase nao cria telas, rotas, componentes React, SQL ou integracoes com TV, Radio, Noticias, Admin, BarAI, BarCoins, Perfil ou Loja.

## Estrutura

```text
src/modules/bolao/
  constants/
  domain/
  repositories/
  services/
  types/
  utils/
  validators/
  index.js
```

## Entidades

- `Campeonato`
- `Temporada`
- `Rodada`
- `Jogo`
- `Palpite`
- `Ranking`
- `Premiacao`
- `Conquista`

Cada entidade possui uma factory em `domain/` e contrato JSDoc em `types/`.

## Services

- `BolaoService`: orquestra criacao e listagem de campeonatos, temporadas, rodadas e jogos.
- `PalpiteService`: cria palpites e aplica validacoes de dominio.
- `RankingService`: gera rankings ordenados a partir de palpites pontuados.
- `PontuacaoService`: calcula e detalha pontuacao.
- `PremiacaoService`: cria premiacoes e conquistas.

## Validators

- Palpite duplicado.
- Horario encerrado.
- Placar valido.
- Usuario elegivel.

## Constantes

- Status dos jogos.
- Tipos de campeonato.
- Tipos de pontuacao.
- Status dos palpites.
- Integracoes futuras preparadas.

## Utilitarios

- `calcularVencedor`
- `calcularPontuacao`
- `validarHorario`
- `ordenarRanking`

## Repositorio

`createInMemoryBolaoRepository` e um reposititorio local em memoria para sustentar o dominio nesta fase. Ele nao substitui banco de dados e nao cria SQL.

## Integracoes futuras

O dominio esta preparado para receber integracoes futuras com:

- BarAI
- BarCoins
- Perfil
- Loja

Essas integracoes estao apenas declaradas como preparadas e desabilitadas. Nenhuma chamada ou acoplamento foi implementado nesta fase.

## Uso basico

```js
import { BolaoService } from './src/modules/bolao'

const campeonato = BolaoService.criarCampeonato({
  nome: 'Bolao Pro 2026',
})
```

## Proximos passos

- Adicionar testes unitarios para validators, services e utils.
- Definir persistencia real e SQL em uma fase futura.
- Criar interface somente depois que os contratos de dominio estiverem validados.
- Integrar BarAI, BarCoins, Perfil e Loja em fases separadas.
