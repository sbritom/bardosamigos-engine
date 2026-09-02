import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  Trophy,
  Users,
  CircleDot,
} from 'lucide-react'
import { EmptyState, Loading } from '../../../../design-system'
import { formatBrazilFullDateTime, isLiveStatus } from '../../../../core/time'
import { FootballStatusBadge } from '../components/FootballCommon'
import { FootballLiveValue } from '../components/FootballLiveMotion'
import { FootballCrest } from '../components/FootballCrest'
import {
  formatFootballScore,
  getFootballMatchDisplayStatus,
  getFootballMatchMinute,
  getFootballMatchTime,
} from '../utils/footballCenterUtils'
import { getFootballMatchDetails } from '../../services/footballCenterService'
import './matchDetails.css'

const STAT_LABELS = {
  shots: 'Finalizações',
  shotsOnTarget: 'No alvo',
  corners: 'Escanteios',
  fouls: 'Faltas',
  cards: 'Cartões',
  possession: 'Posse de bola',
  offsides: 'Impedimentos',
  substitutions: 'Substituições',
  goals: 'Gols',
  halfTime: 'Intervalo',
  penalties: 'Pênaltis',
  attendance: 'Público',
  duration: 'Duração',
}

const STAT_PRIORITY = ['goals', 'halfTime', 'cards', 'substitutions', 'penalties', 'attendance', 'duration', 'shots', 'shotsOnTarget', 'corners', 'fouls', 'possession', 'offsides']

function withPreviewAccess(path) {
  if (typeof window === 'undefined') return path
  const shareToken = new URLSearchParams(window.location.search).get('_vercel_share')
  if (!shareToken) return path
  const url = new URL(path, window.location.origin)
  url.searchParams.set('_vercel_share', shareToken)
  return `${url.pathname}${url.search}`
}

async function fetchProviderMatchDetails(match, signal) {
  const providerId = String(match?.externalRef || match?.external_ref || match?.providerMatchId || '').replace(/^football-data-/, '')
  if (!/^\d{1,12}$/.test(providerId)) return null

  const url = withPreviewAccess(`/api/football/matches?resource=match&matchId=${encodeURIComponent(providerId)}`)
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) return null
  return payload.match || null
}

function mergeMatchDetails(base, provider) {
  if (!provider) return base
  return {
    ...base,
    ...provider,
    id: base.id,
    externalRef: base.externalRef || base.external_ref || provider.providerMatchId,
    round: {
      ...(base.round || {}),
      name: base.round?.name || (provider.matchday ? `Rodada ${provider.matchday}` : ''),
    },
    metadata: {
      ...(base.metadata || {}),
      ...(provider.metadata || {}),
    },
  }
}

function TeamBlock({ name, crest, teamId, onOpen }) {
  return (
    <button
      type="button"
      className="imortal-match-team"
      disabled={!teamId}
      onClick={() => teamId && onOpen?.(teamId)}
    >
      <span className="imortal-match-team__crest">
        <FootballCrest src={crest} name={name} iconSize={32} />
      </span>
      <strong>{name || 'Time'}</strong>
      {teamId ? <small>Ver time</small> : null}
    </button>
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
    {
      label: 'Mandante',
      team: match.homeTeam,
      players: formatLineupSide(lineups?.home || lineups?.homeTeam || lineups?.homeStartingXI),
      bench: formatLineupSide(lineups?.homeBench),
      formation: lineups?.homeFormation || '',
      coach: lineups?.homeCoach?.name || '',
    },
    {
      label: 'Visitante',
      team: match.awayTeam,
      players: formatLineupSide(lineups?.away || lineups?.awayTeam || lineups?.awayStartingXI),
      bench: formatLineupSide(lineups?.awayBench),
      formation: lineups?.awayFormation || '',
      coach: lineups?.awayCoach?.name || '',
    },
  ].filter((side) => side.players.length || side.bench.length || side.formation || side.coach)
}

function formatStatValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') {
    const home = value.home ?? value.homeTeam ?? value.homeValue
    const away = value.away ?? value.awayTeam ?? value.awayValue
    if (home !== undefined || away !== undefined) return `${home ?? '-'} — ${away ?? '-'}`
    return '-'
  }
  return String(value)
}

function getStatistics(match) {
  const entries = Object.entries(match.statistics || {})
    .filter(([key, value]) => value !== null && value !== undefined && value !== '' && key !== 'referee')
    .map(([key, value]) => ({ key, label: STAT_LABELS[key] || key, value: formatStatValue(value) }))

  return entries.sort((left, right) => {
    const leftIndex = STAT_PRIORITY.indexOf(left.key)
    const rightIndex = STAT_PRIORITY.indexOf(right.key)
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex)
  })
}

function getMatchInfo(match) {
  const dateSource = match.localDateIso || match.startsAt
  const dateLabel = dateSource ? formatBrazilFullDateTime(dateSource) : ''
  return [
    { label: 'Estádio', value: match.venue, icon: MapPin },
    { label: 'Cidade', value: match.city, icon: MapPin },
    { label: 'Rodada', value: match.round?.name || (match.matchday ? `Rodada ${match.matchday}` : ''), icon: Trophy },
    { label: 'Fase', value: match.stage, icon: Trophy },
    { label: 'Competição', value: match.competitionName, icon: Trophy },
    { label: 'Árbitro', value: match.referee, icon: CircleDot },
    { label: 'Público', value: match.attendance ? Number(match.attendance).toLocaleString('pt-BR') : '', icon: Users },
    { label: 'Data', value: dateLabel, icon: CalendarDays },
    { label: 'Horário', value: match.localTime || getFootballMatchTime(match), icon: Clock3 },
  ].filter((item) => Boolean(item.value))
}

function getHeroTimeLabel(match) {
  const display = getFootballMatchDisplayStatus(match)
  const live = isLiveStatus(display.value) || isLiveStatus(match?.status)
  return live ? getFootballMatchMinute(match) : getFootballMatchTime(match)
}

function EmptyMatchSection({ children }) {
  return <p className="imortal-match-empty">{children}</p>
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
      if (!result.data) {
        if (active) setState({ loading: false, match: null, error: result.error?.message || '' })
        return
      }

      const controller = new AbortController()
      const providerMatch = await fetchProviderMatchDetails(result.data, controller.signal).catch(() => null)
      if (active) {
        setState({
          loading: false,
          match: mergeMatchDetails(result.data, providerMatch),
          error: result.error?.message || '',
        })
      }
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
  if (!state.match) return <EmptyState title="Partida não encontrada" description="O jogo pode não estar mais disponível." />

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
    <main className="imortal-match-page">
      <div className="imortal-match-topbar">
        <button type="button" onClick={() => navigate('/football')}>
          <ArrowLeft size={16} />
          Voltar ao Futebol
        </button>

        <div className="imortal-match-topbar__status">
          <FootballStatusBadge match={match} />
          {heroTimeLabel ? (
            <FootballLiveValue as="span" value={heroTimeLabel} className="imortal-match-time">
              {heroTimeLabel}
            </FootballLiveValue>
          ) : null}
        </div>
      </div>

      <section className="imortal-match-hero">
        <div className="imortal-match-competition">
          {match.competitionLogo ? <img src={match.competitionLogo} alt="" loading="lazy" /> : null}
          <div>
            <span>IMORTAL0800 • FUTEBOL</span>
            <strong>{match.competitionName || 'Futebol'}</strong>
            {match.round?.name ? <small>{match.round.name}</small> : null}
          </div>
        </div>

        <div className="imortal-match-scoreboard">
          <TeamBlock
            name={match.homeTeam}
            crest={match.homeCrest}
            teamId={match.metadata?.raw?.homeTeam?.id || match.homeTeamId}
            onOpen={(id) => navigate(`/football/times/${id}`)}
          />

          <div className="imortal-match-score">
            <small>PLACAR</small>
            <FootballLiveValue
              as="strong"
              value={formatFootballScore(match)}
              highlight={match.hasScore}
            >
              {formatFootballScore(match)}
            </FootballLiveValue>
            <span>{match.localTime || getFootballMatchTime(match)}</span>
          </div>

          <TeamBlock
            name={match.awayTeam}
            crest={match.awayCrest}
            teamId={match.metadata?.raw?.awayTeam?.id || match.awayTeamId}
            onOpen={(id) => navigate(`/football/times/${id}`)}
          />
        </div>

        {matchInfo.length ? (
          <div className="imortal-match-quickinfo">
            {matchInfo.slice(0, 4).map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <Icon size={14} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="imortal-match-grid">
        <section className="imortal-match-panel">
          <header>
            <span><BarChart3 size={17} /></span>
            <div><strong>Estatísticas</strong><small>Dados disponíveis para a partida</small></div>
          </header>

          {statistics.length ? (
            <div className="imortal-match-stats">
              {statistics.map(({ key, label, value }) => (
                <article key={key}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
          ) : (
            <EmptyMatchSection>As estatísticas ainda não foram disponibilizadas para esta partida.</EmptyMatchSection>
          )}
        </section>

        <section className="imortal-match-panel">
          <header>
            <span><Clock3 size={17} /></span>
            <div><strong>Eventos do jogo</strong><small>Gols, cartões e substituições</small></div>
          </header>

          {timelineItems.length ? (
            <div className="imortal-match-timeline">
              {timelineItems.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  <span className="imortal-match-timeline__minute">{item.minute ? `${item.minute}'` : '—'}</span>
                  <span className="imortal-match-timeline__mark">{item.mark || '•'}</span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMatchSection>Os eventos desta partida ainda não estão disponíveis.</EmptyMatchSection>
          )}
        </section>
      </div>

      <section className="imortal-match-panel">
        <header>
          <span><Users size={17} /></span>
          <div><strong>Escalações</strong><small>Titulares disponibilizados pela fonte</small></div>
        </header>

        {lineupSides.length ? (
          <div className="imortal-match-lineups">
            {lineupSides.map((side) => (
              <article key={side.label}>
                <span>{side.label}</span>
                <h3>{side.team}</h3>
                {(side.formation || side.coach) ? (
                  <p className="imortal-match-lineup-meta">
                    {[side.formation ? `Formação: ${side.formation}` : '', side.coach ? `Técnico: ${side.coach}` : ''].filter(Boolean).join(' • ')}
                  </p>
                ) : null}
                {side.players.length ? (
                  <>
                    <strong className="imortal-match-lineup-title">Titulares</strong>
                    <ol>
                      {side.players.map((player, index) => <li key={`${player}-${index}`}>{player}</li>)}
                    </ol>
                  </>
                ) : null}
                {side.bench.length ? (
                  <details className="imortal-match-bench">
                    <summary>Banco ({side.bench.length})</summary>
                    <p>{side.bench.join(', ')}</p>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyMatchSection>As escalações ainda não foram disponibilizadas para esta partida.</EmptyMatchSection>
        )}
      </section>

      <section className="imortal-match-panel">
        <header>
          <span><Info size={17} /></span>
          <div><strong>Informações da partida</strong><small>Dados gerais do confronto</small></div>
        </header>

        {matchInfo.length ? (
          <div className="imortal-match-info">
            {matchInfo.map(({ label, value, icon: Icon }) => (
              <article key={label}>
                <Icon size={15} />
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMatchSection>Não há informações adicionais disponíveis para esta partida.</EmptyMatchSection>
        )}
      </section>
    </main>
  )
}
