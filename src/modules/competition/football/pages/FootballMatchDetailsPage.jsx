import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Clock3, Shield, Trophy } from 'lucide-react'
import { Button, Card, EmptyState, Loading, StatCard } from '../../../../design-system'
import { formatBrazilFullDateTime, isLiveStatus } from '../../../../core/time'
import { FootballStatusBadge } from '../components/FootballCommon'
import { FootballLiveValue } from '../components/FootballLiveMotion'
import { formatFootballScore, getFootballMatchDisplayStatus, getFootballMatchMinute, getFootballMatchTime } from '../utils/footballCenterUtils'
import { getFootballMatchDetails } from '../../services/footballCenterService'

const STAT_LABELS = {
  shots: 'Finalizacoes',
  shotsOnTarget: 'Finalizacoes no alvo',
  corners: 'Escanteios',
  fouls: 'Faltas',
  cards: 'Cartoes',
  possession: 'Posse de bola',
  offsides: 'Impedimentos',
  substitutions: 'Substituicoes',
}

const STAT_PRIORITY = ['shots', 'shotsOnTarget', 'corners', 'fouls', 'cards', 'possession', 'offsides', 'substitutions']

function TeamBlock({ name, crest }) {
  return (
    <div className="min-w-0 text-center">
      {crest ? <img src={crest} alt="" className="mx-auto h-20 w-20 object-contain" loading="lazy" /> : <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[var(--radius)] border border-[var(--bds-color-primary-hover)] bg-[var(--bds-color-background)] text-[var(--bds-color-primary-hover)]"><Shield size={28} aria-hidden="true" /></div>}
      <h2 className="mt-3 truncate text-xl font-black sm:text-2xl">{name}</h2>
    </div>
  )
}

function getDetailCollections(match) {
  const metadata = match?.metadata || {}
  const raw = metadata.raw || {}
  return {
    timeline: match?.timeline || match?.events || metadata.timeline || metadata.events || raw.timeline || raw.events || [],
    lineups: match?.lineups || metadata.lineups || raw.lineups || null,
  }
}

function getTimelineMinute(item) {
  const value = item?.minute || item?.time || item?.elapsed || ''
  const minute = Number.parseInt(String(value).replace(/\D/g, ''), 10)
  return Number.isFinite(minute) ? minute : 0
}

function getTimelineTypeMark(value) {
  const type = String(value || '').toUpperCase()
  if (type.includes('GOAL') || type.includes('GOL')) return 'GOL'
  if (type.includes('YELLOW') || type.includes('AMAREL')) return 'CA'
  if (type.includes('RED') || type.includes('VERMEL') || type.includes('EXPUL')) return 'CV'
  if (type.includes('SUB') || type.includes('TROCA')) return 'SUB'
  return ''
}

function formatTimelineItem(item) {
  if (!item) return null
  if (typeof item === 'string') return { minute: 0, mark: '', label: item }

  const minute = getTimelineMinute(item)
  const type = item.label || item.type || item.eventType || item.name || item.detail || item.description || ''
  const player = item.player?.name || item.playerName || item.scorer?.name || item.scorerName || ''
  const team = item.team?.name || item.teamName || item.team || ''
  const label = [type, player || team].filter(Boolean).join(' ')

  return label ? { minute, mark: getTimelineTypeMark(type), label } : null
}

function formatLineupSide(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => item.name || item.player?.name || item.playerName || item).filter(Boolean)
}

function getLineupSides(match, lineups) {
  return [
    { label: 'Mandante', team: match.homeTeam, players: formatLineupSide(lineups?.home || lineups?.homeTeam || lineups?.homeStartingXI) },
    { label: 'Visitante', team: match.awayTeam, players: formatLineupSide(lineups?.away || lineups?.awayTeam || lineups?.awayStartingXI) },
  ].filter((side) => side.players.length)
}

function getStatistics(match) {
  const entries = Object.entries(match.statistics || {})
    .filter(([key, value]) => Boolean(value) && key !== 'attendance' && key !== 'referee')
    .map(([key, value]) => ({ key, label: STAT_LABELS[key] || key, value }))

  return entries.sort((left, right) => {
    const leftIndex = STAT_PRIORITY.indexOf(left.key)
    const rightIndex = STAT_PRIORITY.indexOf(right.key)
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex)
  })
}

function getMatchInfo(match) {
  const dateLabel = match.localDateIso || match.startsAt ? formatBrazilFullDateTime(match.localDateIso || match.startsAt) : ''
  return [
    ['Estadio', match.venue],
    ['Cidade', match.city],
    ['Arbitro', match.referee],
    ['Rodada', match.round?.name],
    ['Competicao', match.competitionName],
    ['Data', dateLabel],
    ['Horario', match.localTime || getFootballMatchTime(match)],
  ].filter(([, value]) => Boolean(value))
}

function getHeroTimeLabel(match) {
  const display = getFootballMatchDisplayStatus(match)
  const live = isLiveStatus(display.value) || isLiveStatus(match?.status)
  return live ? getFootballMatchMinute(match) : getFootballMatchTime(match)
}

export default function FootballMatchDetailsPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, match: null, error: '' })
  const pollingStatus = state.match?.status

  useEffect(() => {
    let active = true
    async function load() {
      const result = await getFootballMatchDetails(matchId)
      if (active) setState({ loading: false, match: result.data, error: result.error?.message || '' })
    }
    load()
    const timer = window.setInterval(load, ['AO_VIVO', 'INTERVALO'].includes(pollingStatus) ? 30000 : 60000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [matchId, pollingStatus])

  if (state.loading) return <Loading label="Carregando detalhes da partida" />
  if (state.error) return <EmptyState title="Erro ao carregar partida" description={state.error} />
  if (!state.match) return <EmptyState title="Partida nao encontrada" description="O jogo pode nao estar mais disponivel." />

  const match = state.match
  const { timeline, lineups } = getDetailCollections(match)
  const timelineItems = Array.isArray(timeline)
    ? timeline.map(formatTimelineItem).filter(Boolean).sort((left, right) => left.minute - right.minute)
    : []
  const statistics = getStatistics(match)
  const lineupSides = getLineupSides(match, lineups)
  const matchInfo = getMatchInfo(match)
  const heroTimeLabel = getHeroTimeLabel(match)

  return (
    <section className="space-y-5">
      <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => navigate('/football')}>Voltar</Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <FootballStatusBadge match={match} />
            {heroTimeLabel ? (
              <FootballLiveValue as="span" value={heroTimeLabel} className="bds-football-time-value text-xs font-black tabular-nums text-[var(--bds-color-text-secondary)]">
                {heroTimeLabel}
              </FootballLiveValue>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center">
          {match.competitionLogo && <img src={match.competitionLogo} alt="" className="h-7 w-7 object-contain" loading="lazy" />}
          <span className="text-sm font-bold text-[var(--bds-color-text-secondary)]">{match.competitionName}</span>
          {match.round?.name ? <span className="text-sm font-bold text-[var(--bds-color-text-secondary)]">- {match.round.name}</span> : null}
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
          <TeamBlock name={match.homeTeam} crest={match.homeCrest} />
          <FootballLiveValue
            as="strong"
            value={formatFootballScore(match)}
            highlight={match.hasScore}
            className="bds-football-score-value text-center text-[2.35rem] font-black leading-none text-[var(--bds-color-text)] sm:text-[3.2rem]"
          >
            {formatFootballScore(match)}
          </FootballLiveValue>
          <TeamBlock name={match.awayTeam} crest={match.awayCrest} />
        </div>
      </Card>

      {timelineItems.length ? (
        <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
          <h2 className="flex items-center gap-2 text-xl font-black"><Clock3 size={18} aria-hidden="true" /> Timeline</h2>
          <div className="mt-4 space-y-2">
            {timelineItems.map((item, index) => (
              <p key={`${item.label}-${index}`} className="bds-football-timeline-row flex items-center gap-3 rounded-[var(--radius)] border border-[var(--bds-color-border)] px-3 py-2 text-sm font-bold text-[var(--bds-color-text-secondary)]">
                <span className="bds-football-timeline-minute text-right tabular-nums">{item.minute ? `${item.minute}'` : ''}</span>
                <span className="bds-football-timeline-mark text-center" aria-hidden="true">{item.mark}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </p>
            ))}
          </div>
        </Card>
      ) : null}

      {statistics.length ? (
        <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
          <h2 className="flex items-center gap-2 text-xl font-black"><Trophy size={18} aria-hidden="true" /> Estatisticas</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statistics.map(({ key, label, value }) => (
              <StatCard key={key} label={label} value={value} />
            ))}
          </div>
        </Card>
      ) : null}

      {lineupSides.length ? (
        <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
          <h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays size={18} aria-hidden="true" /> Escalacoes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {lineupSides.map((side) => (
              <div key={side.label} className="rounded-[var(--radius)] border border-[var(--bds-color-border)] p-3">
                <h3 className="text-sm font-black uppercase text-[var(--bds-color-primary-hover)]">{side.label}</h3>
                <p className="mt-1 truncate text-sm font-bold text-[var(--bds-color-text)]">{side.team}</p>
                <p className="mt-2 text-sm text-[var(--bds-color-text-secondary)]">{side.players.join(', ')}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {matchInfo.length ? (
        <Card className="rounded-[var(--radius)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
          <h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays size={18} aria-hidden="true" /> Informacoes da Partida</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {matchInfo.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
          </div>
        </Card>
      ) : null}
    </section>
  )
}
