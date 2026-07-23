import { useMemo, useState } from 'react'
import { Activity, BarChart3, CheckCircle2, Clock3, ListOrdered, Shield, Target } from 'lucide-react'
import { Button, EmptyState } from '../../../../design-system'
import { formatBrazilDate } from '../../../../core/time'
import { calculateStandings } from '../../services/footballCenterService'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'
import { footballMatchBelongsToCompetition, formatFootballScore, getFootballMatchTime } from '../utils/footballCenterUtils'

const BRASILEIRAO_NAV_ITEM = FOOTBALL_COMPETITION_NAV.find((item) => item.id === 'BSA')

function MiniTeamMark({ crest }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center drop-shadow-sm">
      {crest ? <img src={crest} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Shield size={12} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
    </span>
  )
}

function FootballMiniMatch({ match, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(match.id)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[var(--bds-space-8)] border-b border-[color-mix(in_srgb,var(--bds-color-border)_52%,transparent)] px-[var(--bds-space-4)] py-[var(--bds-space-7)] text-left transition hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
    >
      <span className="flex min-w-0 items-center gap-[var(--bds-space-6)]">
        <MiniTeamMark crest={match.homeCrest} />
        <span className="truncate text-xs font-black text-[var(--bds-color-text)]">{match.homeTeam}</span>
      </span>
      <strong className="text-xs font-black tabular-nums text-[var(--bds-color-primary-hover)]">{formatFootballScore(match)}</strong>
      <span className="flex min-w-0 flex-row-reverse items-center gap-[var(--bds-space-6)] text-right">
        <MiniTeamMark crest={match.awayCrest} />
        <span className="truncate text-xs font-black text-[var(--bds-color-text)]">{match.awayTeam}</span>
      </span>
      <span className="col-span-3 flex items-center justify-between gap-[var(--bds-space-8)] text-[var(--bds-font-micro)] font-bold uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">
        <span className="truncate">{match.competitionName}</span>
        <span className="flex items-center gap-[var(--bds-space-4)]"><Clock3 size={11} aria-hidden="true" />{getFootballMatchTime(match) || (match.startsAt ? formatBrazilDate(match.startsAt) : 'A definir')}</span>
      </span>
    </button>
  )
}

function FootballRightBlock({ title, eyebrow, icon: Icon, children }) {
  return (
    <section className="rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_62%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_30%,transparent)] shadow-none">
      <div className="flex items-center gap-[var(--bds-space-8)] border-b border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] px-[var(--bds-space-12)] py-[var(--bds-space-10)]">
        <Icon size={15} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
        <div className="min-w-0">
          {eyebrow ? <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">{eyebrow}</p> : null}
          <h3 className="truncate text-sm font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)]">{title}</h3>
        </div>
      </div>
      <div className="p-[var(--bds-space-10)]">{children}</div>
    </section>
  )
}

function BrasileiraoStandingsPanel({ matches }) {
  const [expanded, setExpanded] = useState(false)
  const rows = useMemo(() => {
    if (!BRASILEIRAO_NAV_ITEM) return []
    return calculateStandings(matches.filter((match) => footballMatchBelongsToCompetition(match, BRASILEIRAO_NAV_ITEM)))
  }, [matches])
  const visibleRows = expanded ? rows : rows.slice(0, 8)

  return (
    <FootballRightBlock title="Classificacao" eyebrow="Brasileirao Serie A" icon={ListOrdered}>
      {rows.length ? (
        <>
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--bds-font-micro)] uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">
              <tr>
                <th scope="col" className="pb-[var(--bds-space-7)]">#</th>
                <th scope="col" className="pb-[var(--bds-space-7)]">Time</th>
                <th scope="col" className="pb-[var(--bds-space-7)] text-right">Pts</th>
                <th scope="col" className="hidden pb-[var(--bds-space-7)] text-right 2xl:table-cell">SG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color-mix(in_srgb,var(--bds-color-border)_50%,transparent)]">
              {visibleRows.map((row) => (
                <tr key={row.name} className="text-[var(--bds-color-text-secondary)]">
                  <td className="py-[var(--bds-space-6)] font-black tabular-nums text-[var(--bds-color-primary-hover)]">{row.position}</td>
                  <td className="min-w-0 py-[var(--bds-space-6)]">
                    <div className="flex min-w-0 items-center gap-[var(--bds-space-6)]">
                      <MiniTeamMark crest={row.crest} />
                      <span className="truncate font-black text-[var(--bds-color-text)]">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-[var(--bds-space-6)] text-right font-black tabular-nums text-[var(--bds-color-text)]">{row.points}</td>
                  <td className="hidden py-[var(--bds-space-6)] text-right tabular-nums 2xl:table-cell">{row.goalDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 8 ? <Button variant="secondary" className="mt-[var(--bds-space-10)] w-full justify-center" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Ver top 8' : 'Ver completa'}</Button> : null}
        </>
      ) : (
        <EmptyState title="Classificacao indisponivel" description="Resultados sincronizados montam a tabela automaticamente." />
      )}
    </FootballRightBlock>
  )
}

function PlaceholderList({ items }) {
  return (
    <div className="space-y-[var(--bds-space-7)]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-[var(--bds-space-8)] border-b border-[color-mix(in_srgb,var(--bds-color-border)_44%,transparent)] pb-[var(--bds-space-7)] text-xs">
          <span className="font-bold text-[var(--bds-color-text-secondary)]">{item.label}</span>
          <strong className="font-black tabular-nums text-[var(--bds-color-text)]">{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function FootballRightPanel({ data, derived, onOpen, statCards }) {
  const matches = data.matches || []
  const stats = statCards || [
    { label: 'Jogos monitorados', value: derived.stats.total },
    { label: 'Ao vivo', value: derived.stats.live },
    { label: 'Finalizados', value: derived.stats.finished },
    { label: 'Proximos', value: derived.stats.upcoming },
    { label: 'Times', value: derived.stats.teams || 0 },
  ]

  return (
    <aside className="space-y-[var(--bds-space-12)]">
      <BrasileiraoStandingsPanel matches={matches} />
      <FootballRightBlock title="Proximos jogos" eyebrow="Agenda" icon={Clock3}>
        {derived.upcoming.length ? <div>{derived.upcoming.slice(0, 4).map((match) => <FootballMiniMatch key={match.id} match={match} onOpen={onOpen} />)}</div> : <EmptyState title="Sem proximos jogos" description="A agenda aparece quando houver partidas futuras." />}
      </FootballRightBlock>
      <FootballRightBlock title="Resultados recentes" eyebrow="Placares" icon={CheckCircle2}>
        {derived.results.length ? <div>{derived.results.slice(0, 4).map((match) => <FootballMiniMatch key={match.id} match={match} onOpen={onOpen} />)}</div> : <EmptyState title="Sem resultados" description="Placares finalizados entram aqui." />}
      </FootballRightBlock>
      <FootballRightBlock title="Artilharia" eyebrow="Em breve" icon={Target}>
        <PlaceholderList items={[{ label: 'Dados oficiais', value: 'Aguardando' }, { label: 'Fonte', value: 'Sincronizacao' }]} />
      </FootballRightBlock>
      <FootballRightBlock title="Estatisticas" eyebrow="Resumo filtrado" icon={BarChart3}>
        <PlaceholderList items={stats} />
      </FootballRightBlock>
      <FootballRightBlock title="Sincronizacao" eyebrow="Status" icon={Activity}>
        <p className="text-xs leading-relaxed text-[var(--bds-color-text-secondary)]">Dados carregados da base sincronizada. Sem novas consultas nesta interface.</p>
      </FootballRightBlock>
    </aside>
  )
}
