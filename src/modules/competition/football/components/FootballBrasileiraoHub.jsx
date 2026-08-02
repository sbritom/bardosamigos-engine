import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, ListOrdered, Trophy } from 'lucide-react'
import { Button } from '../../../../design-system'
import { calculateStandings } from '../../services/footballCenterService'
import { isFinishedStatus, isLiveStatus, nowUtcIso } from '../../../../core/time'
import { FootballStatusBadge } from './FootballCommon'
import { FootballLiveValue } from './FootballLiveMotion'
import { FootballCrest } from './FootballCrest'
import { formatFootballScore, getFootballMatchTime, isFootballMatchToday } from '../utils/footballCenterUtils'

function MiniCrest({ crest, name = '' }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      <FootballCrest src={crest} name={name} iconSize={12} />
    </span>
  )
}

function HubBlock({ title, icon: Icon, children, compact = false }) {
  return (
    <section className={`border-t border-[color-mix(in_srgb,var(--bds-color-border)_50%,transparent)] ${compact ? 'pt-[var(--bds-space-7)]' : 'pt-[var(--bds-space-10)]'}`}>
      <div className="mb-[var(--bds-space-6)] flex items-center gap-[var(--bds-space-6)]">
        <Icon size={14} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
        <h3 className="text-base font-black text-[var(--bds-color-text)]">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function getZoneClass(position, total) {
  if (position <= 4) return 'shadow-[inset_3px_0_0_var(--bds-color-success)]'
  if (position <= 6) return 'shadow-[inset_3px_0_0_var(--bds-color-primary-hover)]'
  if (position <= 12) return 'shadow-[inset_3px_0_0_var(--bds-color-info)]'
  if (position > Math.max(total - 4, 0)) return 'shadow-[inset_3px_0_0_var(--bds-color-danger)]'
  return ''
}

function BrasileiraoTable({ matches }) {
  const [expanded, setExpanded] = useState(false)
  const rows = useMemo(() => calculateStandings(matches), [matches])
  const visibleRows = expanded ? rows : rows.slice(0, 10)

  if (!rows.length) return null

  return (
    <HubBlock title="Classificacao" icon={ListOrdered}>
      <div className="overflow-x-auto border-y border-[color-mix(in_srgb,var(--bds-color-border)_48%,transparent)]">
        <table className="w-full text-left text-xs">
          <thead className="text-[var(--bds-font-micro)] uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">
            <tr>
              <th scope="col" className="py-[var(--bds-space-4)] pl-[var(--bds-space-8)]">#</th>
              <th scope="col" className="py-[var(--bds-space-4)]">Clube</th>
              <th scope="col" className="py-[var(--bds-space-4)] text-right">Pts</th>
              <th scope="col" className="py-[var(--bds-space-4)] text-right">J</th>
              <th scope="col" className="py-[var(--bds-space-4)] pr-[var(--bds-space-8)] text-right">SG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color-mix(in_srgb,var(--bds-color-border)_42%,transparent)]">
            {visibleRows.map((row) => (
              <tr key={row.name} className={`text-[var(--bds-color-text-secondary)] ${getZoneClass(row.position, rows.length)}`}>
                <td className="py-[var(--bds-space-4)] pl-[var(--bds-space-8)] font-black tabular-nums text-[var(--bds-color-primary-hover)]">{row.position}</td>
                <td className="min-w-0 py-[var(--bds-space-4)]">
                  <div className="flex min-w-0 items-center gap-[var(--bds-space-6)]">
                    <MiniCrest crest={row.crest} name={row.name} />
                    <span className="truncate font-black text-[var(--bds-color-text)]">{row.name}</span>
                  </div>
                </td>
                <td className="py-[var(--bds-space-4)] text-right font-black tabular-nums text-[var(--bds-color-text)]">{row.points}</td>
                <td className="py-[var(--bds-space-4)] text-right tabular-nums">{row.played}</td>
                <td className="py-[var(--bds-space-4)] pr-[var(--bds-space-8)] text-right tabular-nums">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 ? <Button variant="secondary" className="mt-[var(--bds-space-8)] w-full justify-center" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Ver top 10' : 'Ver completa'}</Button> : null}
    </HubBlock>
  )
}

function MatchLine({ match, onOpen }) {
  const timeLabel = match.localTime || match.startsAt ? getFootballMatchTime(match) : ''

  return (
    <button
      type="button"
      onClick={() => onOpen(match.id)}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-[var(--bds-space-6)] border-b border-[color-mix(in_srgb,var(--bds-color-border)_38%,transparent)] px-[var(--bds-space-8)] py-[var(--bds-space-4)] text-left transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_6%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_auto] sm:gap-[var(--bds-space-7)]"
    >
      <span className="flex min-w-0 items-center gap-[var(--bds-space-6)]">
        <MiniCrest crest={match.homeCrest} name={match.homeTeam} />
        <span className="truncate text-sm font-bold text-[var(--bds-color-text)]">{match.homeTeam}</span>
      </span>
      <FootballLiveValue as="strong" value={formatFootballScore(match)} highlight={match.hasScore} className="bds-football-score-value text-center text-base font-black tabular-nums text-[var(--bds-color-text)]">
        {formatFootballScore(match)}
      </FootballLiveValue>
      <span className="col-span-2 flex min-w-0 items-center gap-[var(--bds-space-6)] sm:col-span-1 sm:flex-row-reverse sm:text-right">
        <MiniCrest crest={match.awayCrest} name={match.awayTeam} />
        <span className="truncate text-sm font-bold text-[var(--bds-color-text)]">{match.awayTeam}</span>
      </span>
      <span className="min-w-0">
        <FootballStatusBadge match={match} />
      </span>
      {timeLabel ? <span className="text-xs font-black tabular-nums text-[var(--bds-color-text-secondary)]">{timeLabel}</span> : null}
    </button>
  )
}

function MatchList({ title, icon, matches, onOpen, limit = 6 }) {
  if (!matches.length) return null

  return (
    <HubBlock title={title} icon={icon} compact>
      <div className="overflow-hidden border-y border-[color-mix(in_srgb,var(--bds-color-border)_48%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_10%,transparent)]">
        {matches.slice(0, limit).map((match) => <MatchLine key={match.id} match={match} onOpen={onOpen} />)}
      </div>
    </HubBlock>
  )
}

function getRoundMatches(matches, todayMatches, upcomingMatches, resultMatches) {
  const reference = todayMatches[0] || upcomingMatches[0] || resultMatches[0] || matches[0]
  const roundName = reference?.round?.name
  if (!roundName) return []
  return matches.filter((match) => match.round?.name === roundName)
}

export function FootballBrasileiraoHub({ matches, onOpen }) {
  const now = nowUtcIso()
  const todayMatches = useMemo(() => matches.filter((match) => isFootballMatchToday(match, now)), [matches, now])
  const upcomingMatches = useMemo(() => matches
    .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && !isFootballMatchToday(match, now))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()), [matches, now])
  const resultMatches = useMemo(() => matches
    .filter((match) => isFinishedStatus(match.status))
    .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime()), [matches])
  const roundMatches = useMemo(() => getRoundMatches(matches, todayMatches, upcomingMatches, resultMatches), [matches, resultMatches, todayMatches, upcomingMatches])

  if (!matches.length) return null

  return (
    <section className="space-y-[var(--bds-space-8)] rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_52%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_16%,transparent)] p-[var(--bds-space-10)] shadow-none" aria-label="Hub do Brasileirao Serie A">
      <div className="flex flex-wrap items-center justify-between gap-[var(--bds-space-8)]">
        <div className="min-w-0">
          <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">Competicao principal</p>
          <h2 className="text-2xl font-black leading-tight text-[var(--bds-color-text)]">Brasileirao Serie A</h2>
        </div>
        <div className="flex flex-wrap items-center gap-[var(--bds-space-6)] text-xs font-bold text-[var(--bds-color-text-secondary)]">
          <span>{matches.length} jogos</span>
          {todayMatches.length ? <span>{todayMatches.length} hoje</span> : null}
        </div>
      </div>

      <BrasileiraoTable matches={matches} />
      <MatchList title="Jogos da Rodada" icon={Trophy} matches={roundMatches} onOpen={onOpen} limit={10} />
      <MatchList title="Jogos de Hoje" icon={CalendarDays} matches={todayMatches} onOpen={onOpen} limit={8} />
      <MatchList title="Proximos Jogos" icon={Clock3} matches={upcomingMatches} onOpen={onOpen} limit={8} />
      <MatchList title="Ultimos Resultados" icon={CheckCircle2} matches={resultMatches} onOpen={onOpen} limit={8} />
    </section>
  )
}
