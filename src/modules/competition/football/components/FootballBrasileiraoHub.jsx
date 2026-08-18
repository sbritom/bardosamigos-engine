import { useMemo, useState } from 'react'
import { ListOrdered, Trophy } from 'lucide-react'
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

function HubBlock({ title, icon: Icon, children }) {
  return (
    <section className="bds-football-summary-card">
      <div className="bds-football-summary-card__header">
        <Icon size={15} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
        <h3>{title}</h3>
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

  if (!rows.length) {
    return <p className="bds-football-summary-empty">A tabela sera exibida assim que houver resultados sincronizados.</p>
  }

  return (
    <>
      <div className="bds-football-summary-table-wrap">
        <table className="bds-football-summary-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Clube</th>
              <th>Pts</th>
              <th>J</th>
              <th>SG</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.name} className={getZoneClass(row.position, rows.length)}>
                <td className="font-black tabular-nums text-[var(--bds-color-primary-hover)]">{row.position}</td>
                <td>
                  <div className="flex min-w-0 items-center gap-2">
                    <MiniCrest crest={row.crest} name={row.name} />
                    <span className="truncate font-black text-[var(--bds-color-text)]">{row.name}</span>
                  </div>
                </td>
                <td className="font-black tabular-nums text-[var(--bds-color-text)]">{row.points}</td>
                <td className="tabular-nums">{row.played}</td>
                <td className="tabular-nums">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 ? (
        <Button variant="secondary" className="bds-football-summary-toggle" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Mostrar top 10' : 'Ver tabela completa'}
        </Button>
      ) : null}
    </>
  )
}

function MatchLine({ match, onOpen }) {
  const timeLabel = getFootballMatchTime(match) || ''

  return (
    <button type="button" onClick={() => onOpen(match.id)} className="bds-football-summary-match">
      <span className="bds-football-summary-match__team">
        <MiniCrest crest={match.homeCrest} name={match.homeTeam} />
        <span>{match.homeTeam}</span>
      </span>
      <FootballLiveValue as="strong" value={formatFootballScore(match)} highlight={match.hasScore} className="bds-football-summary-match__score">
        {formatFootballScore(match)}
      </FootballLiveValue>
      <span className="bds-football-summary-match__team bds-football-summary-match__team--away">
        <MiniCrest crest={match.awayCrest} name={match.awayTeam} />
        <span>{match.awayTeam}</span>
      </span>
      <span className="bds-football-summary-match__meta">
        <FootballStatusBadge match={match} />
        {timeLabel ? <small>{timeLabel}</small> : null}
      </span>
    </button>
  )
}

function uniqueMatches(matches) {
  const seen = new Set()
  return matches.filter((match) => {
    if (!match?.id || seen.has(match.id)) return false
    seen.add(match.id)
    return true
  })
}

function UpdatedMatches({ matches, onOpen }) {
  const now = nowUtcIso()
  const live = matches.filter((match) => isLiveStatus(match.status))
  const today = matches.filter((match) => !isLiveStatus(match.status) && isFootballMatchToday(match, now))
  const upcoming = matches
    .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && !isFootballMatchToday(match, now))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
  const finished = matches
    .filter((match) => isFinishedStatus(match.status))
    .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime())

  const visible = uniqueMatches([
    ...live,
    ...today,
    ...upcoming.slice(0, 6),
    ...finished.slice(0, 4),
  ]).slice(0, 10)

  if (!visible.length) {
    return <p className="bds-football-summary-empty">Nenhum jogo sincronizado no momento.</p>
  }

  return <div className="bds-football-summary-matches">{visible.map((match) => <MatchLine key={match.id} match={match} onOpen={onOpen} />)}</div>
}

export function FootballBrasileiraoHub({ matches, onOpen }) {
  if (!matches.length) return null

  return (
    <section className="bds-football-summary" aria-label="Resumo do Brasileirao Serie A">
      <div className="bds-football-summary__intro">
        <div>
          <p>Brasileirao Serie A</p>
          <h2>Central do Brasileirão</h2>
        </div>
        <span>{matches.length} jogos sincronizados</span>
      </div>

      <div className="bds-football-summary__grid">
        <HubBlock title="Tabela atualizada" icon={ListOrdered}>
          <BrasileiraoTable matches={matches} />
        </HubBlock>

        <HubBlock title="Jogos atualizados" icon={Trophy}>
          <UpdatedMatches matches={matches} onOpen={onOpen} />
        </HubBlock>
      </div>
    </section>
  )
}
