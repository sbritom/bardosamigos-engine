# Bar Design System (BDS) 1.0

## Objetivo

O Bar Design System e a biblioteca visual oficial do Bar dos Amigos Engine. Ele centraliza tokens, temas, componentes base, regras de iconografia e convencoes para que novas telas sejam construidas com uma identidade unica.

Esta versao cria a fundacao reutilizavel. Ela nao redesenha telas existentes e nao altera funcionalidades.

## Estrutura

```text
src/design-system/
  components/
  docs/
  hooks/
  icons/
  layouts/
  styles/
  theme/
  tokens/
  utils/
```

## Paleta Oficial

| Token | Uso | Dark |
| --- | --- | --- |
| `background` | Fundo principal | `#050505` |
| `backgroundSecondary` | Fundo secundario | `#080808` |
| `surface` | Cards e paineis | `#111315` |
| `surfaceElevated` | Superficie elevada | `#191c20` |
| `hover` | Hover discreto | `#1f2329` |
| `border` | Bordas | `#2a2e35` |
| `text` | Texto principal | `#f5f5f5` |
| `textSecondary` | Texto secundario | `#a1a1aa` |
| `textMuted` | Texto auxiliar | `#71717a` |
| `primary` | Dourado oficial | `#d4af37` |
| `primaryHover` | Dourado hover | `#f2c94c` |
| `success` | Sucesso | `#16c47f` |
| `warning` | Alerta | `#f59e0b` |
| `danger` | Erro | `#ff4444` |
| `info` | Informacao | `#38bdf8` |

## Tipografia

Escala oficial:

- `display`: destaques raros.
- `h1`: titulo de pagina.
- `h2`: titulo de secao principal.
- `h3`: titulo de painel.
- `title`: titulos compactos.
- `text`: corpo padrao.
- `caption`: legenda e metadados.
- `overline`: eyebrow, status e labels curtos.

Todos os estilos mantem `letter-spacing: 0`, exceto `overline`, que usa `0.08em`.

## Espacamento

Escala baseada em 8px:

- `4`, `8`, `16`, `24`, `32`, `40`, `48`, `64`, `80`, `96`.

Use a escala para padding, gap, margin e dimensoes de blocos fixos.

## Radius

- `sm`: pequenos controles.
- `md`: inputs e elementos compactos.
- `lg`: cards e paineis.
- `hero`: areas de destaque.
- `full`: pills e avatares circulares.

## Sombras

- `level1`: cards discretos.
- `level2`: paineis.
- `level3`: superficies elevadas.
- `hero`: destaque principal.
- `hover`: estado de hover.
- `modal`: dialogos e overlays.

## Animacoes e Transicoes

Padroes oficiais:

- `hover`: transform, borda e sombra.
- `fade`: opacidade.
- `slide`: entrada/saida de paineis.
- `focus`: anel de foco.
- `loading`: feedback de carregamento.
- `skeleton`: shimmer discreto.

Evite animacoes decorativas longas ou chamativas.

## Componentes Base

Componentes prontos para uso:

- `Button`
- `Card`
- `Badge`
- `SectionHeader`
- `CardHeader`
- `Panel`
- `EmptyState`
- `Skeleton`
- `LoadingSkeleton`
- `ErrorState`

Componentes ja existentes no BDS continuam disponiveis para formularios, tabelas, navegacao, feedback e layout.

## Componentes Premium 1.1

Cards oficiais:

- `HeroCard`: destaques principais e areas nobres.
- `FeatureCard`: recursos e chamadas de modulo.
- `MatchCard`: jogos, placares e confrontos.
- `NewsCard`: noticias sincronizadas.
- `CommunityCard`: sinais e estatisticas da comunidade.
- `ToolCard`: ferramentas do BarStudio e utilidades.
- `PlayerCard`: radio, video e players futuros.
- `StatsCard`: metricas compactas.

Estados:

- `EmptyState`: estado vazio padrao.
- `LoadingSkeleton`: carregamento estrutural.
- `ErrorState`: erro com acao opcional.

Botoes:

- `ActionButton` com variantes `primary`, `secondary`, `outline`, `ghost` e `danger`.
- Suporta `loading` e `disabled`.

Badges e indicadores:

- `StatusBadge`: `AO VIVO`, `FINALIZADO`, `EM BREVE`, `NOVO`, `DESTAQUE`, `SUCESSO`, `ALERTA`, `ERRO`.
- `LiveIndicator`: indicador vivo com ponto.
- `MetricChip`: metrica curta.
- `StatBadge`: badge numerico.

Layouts:

- `ResponsiveContainer`
- `DashboardGrid`
- `Stack`
- `Inline`
- `Divider`
- `Section`
- `Panel`

## Exemplos

```jsx
import {
  ActionButton,
  DashboardGrid,
  HeroCard,
  MatchCard,
  Section,
  StatusBadge,
} from '../design-system'

export function Example() {
  return (
    <Section title="Futebol" subtitle="Dados sincronizados">
      <HeroCard
        eyebrow="Live Match Center"
        title="Brasil x Argentina"
        subtitle="Copa do Mundo FIFA 2026"
        action={<ActionButton>Fazer Palpite</ActionButton>}
      />

      <DashboardGrid>
        <MatchCard
          homeTeam="Brasil"
          awayTeam="Argentina"
          competition="Copa do Mundo"
          status="AO VIVO"
          score="1 x 0"
        />
      </DashboardGrid>

      <StatusBadge status="DESTAQUE" />
    </Section>
  )
}
```

## Icones

Pacote oficial: `lucide-react`.

Tamanhos padrao:

- `xs`: 14
- `sm`: 16
- `md`: 20
- `lg`: 24
- `xl`: 32

Use icones dentro de botoes de acao quando existir um simbolo familiar para o comando.

## Regras de Uso

- Novas telas devem importar componentes de `src/design-system`.
- Nao criar estilos isolados quando houver token ou componente BDS equivalente.
- Nao criar outro pacote de icones.
- Nao usar valores soltos para cores, sombras, radius ou espacamento em componentes novos.
- Estados de loading, vazio e erro devem usar componentes BDS.
- O tema dark e o tema oficial atual. O tema light fica preparado para uso futuro.

## Adocao Gradual

Esta sprint nao importa os estilos globais do BDS automaticamente para evitar mudancas visuais nas telas existentes. As proximas sprints devem aplicar o BDS por modulo, com revisao visual controlada.
