# Bar Extension Engine (BEE)

## Objetivo

O Bar Extension Engine, ou BEE, e a camada oficial de extensibilidade do Bar dos Amigos Engine. Ele permite que novos modulos sejam adicionados sem alterar o nucleo da aplicacao.

Nesta fase, o BEE entrega apenas infraestrutura. Nenhum modulo real foi implementado, nenhuma rota existente foi alterada e nenhuma interface foi criada.

## Arquitetura

```text
src/core/extensions/
  engine/
  registry/
  loader/
  permissions/
  events/
  menu/
  navigation/
  lifecycle/
  api/
  hooks/
  docs/
```

## Responsabilidades

- Registrar extensoes por manifesto.
- Controlar ciclo de vida de extensoes.
- Declarar menus e rotas futuras sem acoplar ao router atual.
- Declarar permissoes por modulo.
- Declarar e emitir eventos globais.
- Carregar extensoes de forma padronizada.
- Expor uma API interna para futuras extensoes.

## Ciclo de vida

O lifecycle oficial do BEE possui:

- `install`
- `enable`
- `disable`
- `uninstall`
- `update`

Cada extensao pode implementar callbacks opcionais com esses nomes. O BEE chama esses callbacks com um `ExtensionContext`.

## Contratos principais

- `Extension`
- `ExtensionManifest`
- `ExtensionContext`
- `ExtensionPermission`
- `ExtensionRoute`
- `ExtensionMenu`
- `ExtensionEvent`

Os contratos JSDoc ficam em `src/core/extensions/docs/types.js`.

## Como criar novos modulos futuramente

Uma extensao deve declarar um manifesto:

```js
const extension = {
  manifest: {
    id: 'example-module',
    name: 'Example Module',
    version: '1.0.0',
    permissions: [],
    routes: [],
    menus: [],
    events: [],
  },
}
```

Depois, a extensao podera ser registrada pelo BEE:

```js
await barExtensionEngine.register(extension)
```

Nesta fase, esse registro nao conecta a extensao ao layout, ao router ou a qualquer modulo real.

## Boas praticas

- Manifestos devem ser pequenos, explicitos e versionados.
- Extensoes devem declarar permissoes antes de acessar recursos.
- Menus e rotas devem ser declarativos.
- Eventos devem ter nomes com namespace, por exemplo `store:order-created`.
- Extensoes nao devem depender de detalhes internos de outros modulos.
- Integracoes devem ser feitas por API, eventos ou capabilities futuras.

## Integracoes futuras

O BEE foi preparado para integrar futuramente com:

- BarAI: extensoes poderao declarar capabilities de inteligencia.
- Competition Engine: competicoes poderao ser instaladas como extensoes.
- BarCoins: modulos poderao declarar eventos de recompensa.
- Loja: produtos e resgates poderao ser expandidos por extensoes.
- Admin: admins poderao gerenciar instalacao, permissoes e status.
- TV: canais e recursos de midia poderao virar extensoes.
- Radio: estacoes e experiencias de audio poderao virar extensoes.

Nenhuma dessas integracoes foi implementada nesta fase.

## Fora do escopo

- Modulos reais.
- Paginas React.
- Componentes visuais.
- Supabase.
- SQL.
- Alteracoes de rotas existentes.
- Alteracoes de layout.
