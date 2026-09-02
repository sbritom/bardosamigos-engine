import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, Radio, RefreshCw, TableProperties, Trophy } from 'lucide-react'
import { Button, EmptyState } from '../../../../design-system'
import { isFinishedStatus, isLiveStatus, nowUtcIso } from '../../../../core/time'
import { FootballCrest } from '../components/FootballCrest'
import { FootballStatusBadge } from '../components/FootballCommon'
import {
  formatFootballScore,
  getFootballMatchTime,
  isFootballMatchToday,
} from '../utils/footballCenterUtils'
import { calculateStandings, listFootballCenterData } from '../../services/footballCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../services/footballAutoSyncService'
import './footballMotion.css'
import './footballTheme.css'

const COMPETITION_PRIORITY = ['BSA', 'CL', 'PL', 'PD', 'SA', 'BL1', 'FL1', 'PPL', 'DED', 'WC']

const COMPETITION_META = {
  BSA: { short: 'BRA', country: 'Brasil' },
  CL: { short: 'UCL', country: 'Europa' },
  PL: { short: 'ENG', country: 'Inglaterra' },
  PD: { short: 'ESP', country: 'Espanha' },
  SA: { short: 'ITA', country: 'Itália' },
  BL1: { short: 'ALE', country: 'Alemanha' },
  FL1: { short: 'FRA', country: 'França' },
  PPL: { short: 'POR', country: 'Portugal' },
  DED: { short: 'HOL', country: 'Holanda' },
  WC: { short: 'MUN', country: 'Mundial' },
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase()
}

function competitionKey(match) {
  return String(match?.competitionId || normalizeCode(match?.competitionCode) || match?.competitionName || 'competicao')
}

function buildCompetitions(matches = []) {
  const map = new Map()

  matches.forEach((match) => {
    const key = competitionKey(match)
    const code = normalizeCode(match.competitionCode)
    const current = map.get(key) || {
      id: key,
      code,
      name: match.competitionName || code || 'Competição',
      country: match.country || COMPETITION_META[code]?.country || '',
      emblem: match.competitionLogo || match.competitionEmblem || '',
      matches: [],
    }

    current.code = current.code || code
    current.name = current.name || match.competitionName
    current.country = current.country || match.country || COMPETITION_META[code]?.country || ''
    current.emblem = current.emblem || match.competitionLogo || match.competitionEmblem || ''
    current.matches.push(match)
    map.set(key, current)
  })

  return [...map.values()].sort((left, right) => {
    const leftIndex = COMPETITION_PRIORITY.indexOf(left.code)
    const rightIndex = COMPETITION_PRIORITY.indexOf(right.code)
    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1
      if (rightIndex === -1) return -1
      if (leftIndex !== rightIndex) return leftIndex - rightIndex
    }
    return left.name.localeCompare(right.name, 'pt-BR')
  })
}

function MiniCrest({ src, name }) {
  return (
    <span className="bds-football-mini-crest">
      <FootballCrest src={src} name={name} iconSize={14} />
    </span>
  )
}

function CompetitionMark({ competition }) {
  if (competition.emblem) {
    return <img src={competition.emblem} alt="" className="bds-football-competition-emblem" />
  }

  return (
    <span className="bds-football-competition-mark" aria-hidden="true">
      {COMPETITION_META[competition.code]?.short || competition.code?.slice(0, 3) || '⚽'}
    </span>
  )
}

function MatchRow({ match, onOpen }) {
  return (
    <button type="button" className="bds-football-center-match" onClick={() => onOpen(match.id)}>
      <span className="bds-football-center-team">
        <MiniCrest src={match.homeCrest} name={match.homeTeam} />
        <strong>{match.homeTeam}</strong>
      </span>
      <span className="bds-football-center-score">{formatFootballScore(match)}</span>
      <span className="bds-football-center-team bds-football-center-team--away">
        <MiniCrest src={match.awayCrest} name={match.awayTeam} />
        <strong>{match.awayTeam}</strong>
      </span>
      <span className="bds-football-center-match-meta">
        <FootballStatusBadge match={match} />
        <small>{getFootballMatchTime(match)}</small>
      </span>
    </button>
  )
}

function MatchGroup({ title, icon: Icon, matches, onOpen, limit = 8 }) {
  if (!matches.length) return null

  return (
    <section className="bds-football-center-block">
      <header className="bds-football-center-block__header">
        <span><Icon size={15} /></span>
        <h3>{title}</h3>
        <small>{matches.length}</small>
      </header>
      <div className="bds-football-center-match-list">
        {matches.slice(0, limit).map((match) => <MatchRow key={match.id} match={match} onOpen={onOpen} />)}
      </div>
    </section>
  )
}

function StandingsTable({ matches, compact = false }) {
  const rows = useMemo(() => calculateStandings(matches), [matches])
  const visibleRows = compact ? rows.slice(0, 6) : rows

  if (!rows.length) {
    return <p className="bds-football-center-empty">Classificação ainda não disponível para esta competição.</p>
  }

  return (
    <div className="bds-football-center-table-wrap">
      <table className="bds-football-center-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>SG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.name}>
              <td><strong>{row.position}</strong></td>
              <td>
                <span className="bds-football-center-table-team">
                  <MiniCrest src={row.crest} name={row.name} />
                  <strong>{row.name}</strong>
                </span>
              </td>
              <td>{row.played}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
              <td><strong>{row.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompetitionSummary({ competition, onOpen }) {
  const now = nowUtcIso()
  const matches = competition.matches
  const live = matches.filter((match) => isLiveStatus(match.status))
  const today = matches.filter((match) => isFootballMatchToday(match, now) && !isFinishedStatus(match.status))
  const upcoming = matches
    .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
  const results = matches
    .filter((match) => isFinishedStatus(match.status))
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
  const featuredGames = [...live, ...today, ...upcoming, ...results].filter((match, index, list) => (
    list.findIndex((item) => item.id === match.id) === index
  ))

  return (
    <div className="bds-football-center-summary-grid">
      <section className="bds-football-center-block">
        <header className="bds-football-center-block__header">
          <span><CalendarDays size={15} /></span>
          <h3>Jogos em destaque</h3>
        </header>
        {featuredGames.length ? (
          <div className="bds-football-center-match-list">
            {featuredGames.slice(0, 6).map((match) => <MatchRow key={match.id} match={match} onOpen={onOpen} />)}
          </div>
        ) : <p className="bds-football-center-empty">Nenhum jogo disponível.</p>}
      </section>

      <section className="bds-football-center-block">
        <header className="bds-football-center-block__header">
          <span><TableProperties size={15} /></span>
          <h3>Classificação</h3>
        </header>
        <StandingsTable matches={matches} compact />
      </section>
    </div>
  )
}

function CompetitionMatches({ competition, onOpen }) {
  const now = nowUtcIso()
  const matches = competition.matches
  const live = matches.filter((match) => isLiveStatus(match.status))
  const today = matches.filter((match) => isFootballMatchToday(match, now) && !isLiveStatus(match.status) && !isFinishedStatus(match.status))
  const upcoming = matches
    .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && !isFootballMatchToday(match, now))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
  const results = matches
    .filter((match) => isFinishedStatus(match.status))
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))

  return (
    <div className="bds-football-center-groups">
      <MatchGroup title="Ao vivo" icon={Radio} matches={live} onOpen={onOpen} />
      <MatchGroup title="Jogos de hoje" icon={CalendarDays} matches={today} onOpen={onOpen} />
      <MatchGroup title="Próximos jogos" icon={Clock3} matches={upcoming} onOpen={onOpen} limit={12} />
      <MatchGroup title="Últimos resultados" icon={CheckCircle2} matches={results} onOpen={onOpen} limit={12} />
      {!matches.length ? <p className="bds-football-center-empty">Nenhum jogo disponível.</p> : null}
    </div>
  )
}

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('')
  const [activeTab, setActiveTab] = useState('summary')
  const hasLiveMatchRef = useRef(false)

  async function load({ syncFirst = false } = {}) {
    try {
      if (syncFirst) {
        setRefreshing(true)
        await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
      }
      const result = await listFootballCenterData()
      hasLiveMatchRef.current = hasLiveFootballMatch(result.data)
      setState({ loading: false, data: result.data, error: result.error?.message || '' })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true
    let timer = null

    async function safeLoad() {
      await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
      const result = await listFootballCenterData()
      if (active) {
        hasLiveMatchRef.current = hasLiveFootballMatch(result.data)
        setState({ loading: false, data: result.data, error: result.error?.message || '' })
        timer = window.setTimeout(safeLoad, getFootballAutoSyncInterval(hasLiveMatchRef.current))
      }
    }

    safeLoad()
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const competitions = useMemo(() => buildCompetitions(state.data?.matches || []), [state.data?.matches])

  useEffect(() => {
    if (!competitions.length) return
    if (competitions.some((item) => item.id === selectedCompetitionId)) return
    const brasileirao = competitions.find((item) => item.code === 'BSA')
    setSelectedCompetitionId((brasileirao || competitions[0]).id)
  }, [competitions, selectedCompetitionId])

  const selectedCompetition = competitions.find((item) => item.id === selectedCompetitionId) || competitions[0]

  function selectCompetition(id) {
    setSelectedCompetitionId(id)
    setActiveTab('summary')
  }

  function openMatch(matchId) {
    navigate(`/football/jogos/${matchId}`)
  }

  if (state.loading) {
    return <section className="bds-football-page"><div className="bds-football-simple-loading">Carregando competições...</div></section>
  }
  if (state.error) return <EmptyState title="Não foi possível carregar o futebol" description={state.error} />
  if (!state.data || !competitions.length) return <EmptyState title="Nenhuma competição sincronizada" description="Aguarde a próxima sincronização dos dados." />

  const liveCount = selectedCompetition.matches.filter((match) => isLiveStatus(match.status)).length
  const finishedCount = selectedCompetition.matches.filter((match) => isFinishedStatus(match.status)).length
  const upcomingCount = selectedCompetition.matches.length - liveCount - finishedCount

  return (
    <section className="bds-football-page">
      <header className="imortal-football-intro">
        <div>
          <span>IMORTAL0800</span>
          <h1>Central do Futebol</h1>
          <p>Jogos, resultados, classificação, estatísticas, escalações e bolão em um só lugar.</p>
        </div>
        <button type="button" className="imortal-football-pool" onClick={() => navigate('/palpites')}>
          <Trophy size={16} />
          Ir para o Bolão
        </button>
      </header>

      <div className="bds-football-center">
      <aside className="bds-football-leagues">
        <div className="bds-football-leagues__title">
          <Trophy size={18} />
          <div><strong>Competições</strong><small>{competitions.length} disponíveis</small></div>
        </div>
        <nav className="bds-football-leagues__list" aria-label="Competições de futebol">
          {competitions.map((competition) => (
            <button
              key={competition.id}
              type="button"
              className={competition.id === selectedCompetition?.id ? 'is-active' : ''}
              onClick={() => selectCompetition(competition.id)}
            >
              <CompetitionMark competition={competition} />
              <span><strong>{competition.name}</strong><small>{competition.country || competition.code}</small></span>
              <em>{competition.matches.length}</em>
            </button>
          ))}
        </nav>
      </aside>

      <main className="bds-football-center-main">
        <header className="bds-football-center-hero">
          <div className="bds-football-center-identity">
            <CompetitionMark competition={selectedCompetition} />
            <div>
              <span>{selectedCompetition.country || 'Futebol'}</span>
              <h1>{selectedCompetition.name}</h1>
              <p>Jogos e classificação sincronizados automaticamente.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => load({ syncFirst: true })} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'bds-football-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </header>

        <div className="bds-football-center-stats">
          <span><strong>{selectedCompetition.matches.length}</strong> jogos</span>
          <span className={liveCount ? 'is-live' : ''}><strong>{liveCount}</strong> ao vivo</span>
          <span><strong>{upcomingCount}</strong> próximos</span>
          <span><strong>{finishedCount}</strong> finalizados</span>
        </div>

        <div className="imortal-football-features" aria-label="Recursos do futebol">
          <span><strong>Estatísticas</strong><small>abra uma partida para ver os dados disponíveis</small></span>
          <span><strong>Escalações</strong><small>disponíveis dentro dos detalhes da partida</small></span>
          <button type="button" onClick={() => navigate('/palpites')}>
            <strong>Bolão</strong>
            <small>faça seus palpites</small>
          </button>
        </div>

        <nav className="bds-football-center-tabs" aria-label="Seções da competição">
          <button type="button" className={activeTab === 'summary' ? 'is-active' : ''} onClick={() => setActiveTab('summary')}>Resumo</button>
          <button type="button" className={activeTab === 'matches' ? 'is-active' : ''} onClick={() => setActiveTab('matches')}>Jogos</button>
          <button type="button" className={activeTab === 'standings' ? 'is-active' : ''} onClick={() => setActiveTab('standings')}>Classificação</button>
        </nav>

        <div className="bds-football-center-content">
          {activeTab === 'summary' && <CompetitionSummary competition={selectedCompetition} onOpen={openMatch} />}
          {activeTab === 'matches' && <CompetitionMatches competition={selectedCompetition} onOpen={openMatch} />}
          {activeTab === 'standings' && (
            <section className="bds-football-center-block">
              <header className="bds-football-center-block__header"><span><TableProperties size={15} /></span><h3>Classificação completa</h3></header>
              <StandingsTable matches={selectedCompetition.matches} />
            </section>
          )}
        </div>
      </main>
      </div>
    </section>
  )
}
