# BarAI

## Objetivo

BarAI e o nucleo de inteligencia do Bar dos Amigos Engine. A Fase 2 cria apenas a arquitetura central, sem integrar TV, Radio, Noticias, Bolao, BarCoins, Admin ou qualquer funcionalidade existente.

O modulo segue sem chamadas para APIs externas. O processamento continua usando o provider local baseado em regras criado na fundacao.

## Arquitetura

```text
src/ai-engine/
  baraiCore.js
  config/
    baraiConfig.js
  personality/
    baraiPersonality.js
  memory/
    baraiMemory.js
  modules/
    baraiModuleRegistry.js
  events/
    baraiEventBus.js
  capabilities/
    baraiCapabilities.js
```

## BarAI Core

`BarAI Core` centraliza o acesso ao motor local e aos sistemas internos:

- `config`: configuracao geral do BarAI.
- `personality`: tom amigavel, esportivo e bem-humorado.
- `memory`: memoria em memoria, preparada para persistencia futura.
- `moduleRegistry`: registro de modulos que poderao usar BarAI no futuro.
- `eventBus`: eventos internos para comunicacao desacoplada.
- `capabilities`: flags para habilitar ou desabilitar recursos sem mudar codigo.

## Como usar

```js
import { barAiCore } from './src/ai-engine'

const response = await barAiCore.analyze({
  module: 'core',
  input: 'Contexto local para analise',
})
```

Metodos principais:

- `barAiCore.analyze(request)`
- `barAiCore.generateInsight(request)`
- `barAiCore.generateRecommendation(request)`
- `barAiCore.summarize(request)`
- `barAiCore.healthCheck()`

## Configuracao

```js
barAiCore.config.updateConfig({
  enabled: true,
  memoryEnabled: true,
  eventsEnabled: true,
})
```

## Personalidade

```js
barAiCore.personality.setPersonality({
  tone: 'sports',
  humorLevel: 0.4,
})
```

A personalidade e adicionada ao contexto das requisicoes para orientar providers futuros sem acoplar regras aos modulos do produto.

## Memoria

```js
barAiCore.memory.remember('profile:123', {
  preference: 'conteudo esportivo',
})

const memories = barAiCore.memory.recall('profile:123')
```

Nesta fase, a memoria e apenas local e em memoria.

## Module Registry

```js
barAiCore.moduleRegistry.registerModule({
  id: 'bolao',
  name: 'Bolao',
  enabled: false,
  capabilities: ['insight', 'summary'],
})
```

O registry apenas declara modulos futuros. Ele nao integra nem ativa funcionalidades existentes.

## Event Bus

```js
const unsubscribe = barAiCore.eventBus.on('barai:response', (payload) => {
  console.log(payload)
})

unsubscribe()
```

Eventos internos atuais:

- `barai:request`
- `barai:response`

## Capabilities

```js
barAiCore.capabilities.disable('summary')
barAiCore.capabilities.enable('summary')
```

Capabilities iniciais:

- `analyze`
- `insight`
- `recommendation`
- `summary`
- `memory`
- `events`
- `externalProviders`
- `moduleIntegrations`

`externalProviders` e `moduleIntegrations` ficam desabilitadas por padrao.

## Regras de seguranca

- Nao colocar chaves privadas no frontend.
- Nao chamar OpenAI ou APIs externas nesta fase.
- Sanitizar entradas, saidas, logs e memoria.
- Manter adapters e eventos tolerantes a erro.
- Habilitar integracoes futuras apenas por capability e configuracao explicita.

## Proximos passos

- Criar testes unitarios para BarAI Core, Event Bus, Memory e Capabilities.
- Definir persistencia segura para memoria e logs.
- Definir contratos por modulo antes de qualquer integracao real.
- Adicionar providers externos somente em ambiente seguro e com variaveis de ambiente protegidas.
