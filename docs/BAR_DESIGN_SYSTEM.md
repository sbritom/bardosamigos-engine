# Bar Design System (BDS)

## Objetivo

O Bar Design System e a biblioteca oficial de componentes do Bar dos Amigos Engine. Ele foi criado para permitir adocao gradual, sem substituir componentes existentes nesta fase.

## Identidade visual

O BDS parte de uma experiencia escura, esportiva e operacional, com contraste alto, superficies discretas e destaque em dourado/ambar. O tema light fica preparado para uso futuro.

## Paleta de cores

- Background dark: `#07090f`
- Surface dark: `#111827`
- Surface alternativa: `#1f2937`
- Texto principal: `#f9fafb`
- Texto secundario: `#9ca3af`
- Primary: `#f59e0b`
- Success: `#22c55e`
- Warning: `#f97316`
- Danger: `#ef4444`
- Info: `#38bdf8`

## Estrutura

```text
src/design-system/
  components/
  layouts/
  icons/
  theme/
  tokens/
  hooks/
  utils/
  docs/
```

## Componentes

O BDS inclui componentes de acao, dados, feedback, formulario, navegacao e layout:

- Button, IconButton, Card, StatCard, Badge, Avatar, Chip
- Modal, Drawer, Sidebar, Topbar, Tabs
- Table, DataGrid, EmptyState, Loading, Skeleton, Spinner
- Tooltip, Dropdown, Select, Input, Textarea
- Checkbox, Radio, Switch
- Progress, ProgressCircle, Alert, Toast
- Breadcrumb, Pagination

## Temas e tokens

Tokens disponiveis:

- cores
- tipografia
- espacamentos
- bordas
- sombras
- animacoes
- radius

Temas:

- `dark`
- `light`

## Boas praticas

- Novas interfaces devem importar componentes de `src/design-system`.
- Componentes devem receber dados por props e nao acessar regras de negocio diretamente.
- Estados vazios, carregamento e erro devem ser tratados com componentes do BDS.
- Tokens devem ser preferidos a valores soltos.
- O tema light deve ser tratado como preparado, nao como tema principal nesta fase.

## Acessibilidade

- Botoes iconicos devem receber `label`.
- Dialogs devem usar titulo acessivel.
- Inputs devem ser renderizados com label.
- Feedbacks importantes devem usar `role="alert"` ou `role="status"`.
- Componentes interativos devem preservar navegação por teclado.

## Convencoes de nomenclatura

- Componentes usam PascalCase.
- Classes internas usam prefixo `bds-`.
- Tokens usam nomes semanticos.
- Hooks usam prefixo `use`.

## Adoção gradual

Esta fase nao substitui componentes existentes. O BDS fica disponivel para futuras telas e refatores planejados.
