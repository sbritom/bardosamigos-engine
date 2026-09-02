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

const COMPETITION_PRIORITY = ['WC', 'CL', 'BL1', 'DED', 'BSA', 'PD', 'FL1', 'ELC', 'PPL', 'EC', 'SA', 'PL']

const COMPETITION_META = {
  WC: { short: 'WC', country: 'Mundial', name: 'FIFA World Cup', emblem: 'https://crests.football-data.org/world.png' },
  CL: { short: 'UCL', country: 'Europa', name: 'UEFA Champions League', emblem: 'https://crests.football-data.org/CL.png' },
  BL1: { short: 'GER', country: 'Alemanha', name: 'Bundesliga', emblem: 'https://crests.football-data.org/BL1.png' },
  DED: { short: 'NED', country: 'Holanda', name: 'Eredivisie', emblem: 'https://crests.football-data.org/DED.png' },
  BSA: { short: 'BRA', country: 'Brasil', name: 'Campeonato Brasileiro Série A', emblem: 'https://crests.football-data.org/bsa.png' },
  PD: { short: 'ESP', country: 'Espanha', name: 'Primera Division', emblem: 'https://crests.football-data.org/PD.png' },
  FL1: { short: 'FRA', country: 'França', name: 'Ligue 1', emblem: 'https://crests.football-data.org/FL1.png' },
  ELC: { short: 'ENG', country: 'Inglaterra', name: 'Championship', emblem: 'https://crests.football-data.org/ELC.png' },
  PPL: { short: 'POR', country: 'Portugal', name: 'Primeira Liga', emblem: 'https://crests.football-data.org/PPL.png' },
  EC: { short: 'EURO', country: 'Europa', name: 'European Championship', emblem: 'https://crests.football-data.org/EC.png' },
  SA: { short: 'ITA', country: 'Itália', name: 'Serie A', emblem: 'https://crests.football-data.org/SA.png' },
  PL: { short: 'ENG', country: 'Inglaterra', name: 'Premier League', emblem: 'https://crests.football-data.org/PL.png' },
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase()
}

function withPreviewAccess(path) {
  if (typeof window === 'undefined') return path

  const shareToken = new URLSearchParams(window.location.search).get('_vercel_share')
  if (!shareToken) return path

  const url = new URL(path, window.location.origin)
  url.searchParams.set('_vercel_share', shareToken)
  return `${url.pathname}${url.search}`
}

async function fetchOfficialScorers(competitionCode, signal) {
  const url = withPreviewAccess(`/api/football/matches?resource=scorers&competition=${encodeURIComponent(competitionCode)}`)
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('Resposta inválida da artilharia.')
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Artilharia oficial indisponível.')
  return payload
}

async function fetchOfficialStandings(competitionCode, signal) {
  const url = withPreviewAccess(`/api/football/matches?resource=standings&competition=${encodeURIComponent(competitionCode)}`)
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('Resposta inválida da classificação.')
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Classificação oficial indisponível.')
  return payload
}
function competitionKey(match) {
  return String(normalizeCode(match?.competitionCode) || match?.competitionId || match?.competitionName || 'competicao')
}

function buildCompetitions(matches = []) {
  const map = new Map(
    COMPETITION_PRIORITY.map((code) => {
      const meta = COMPETITION_META[code]
      return [code, {
        id: code,
        code,
        name: meta?.name || code,
        country: meta?.country || '',
        emblem: meta?.emblem || '',
        matches: [],
      }]
    }),
  )

  matches.forEach((match) => {
    const key = competitionKey(match)
    const code = normalizeCode(match.competitionCode)
    const current = map.get(key) || {
      id: key,
      code,
      name: match.competitionName || COMPETITION_META[code]?.name || code || 'Competição',
      country: match.country || COMPETITION_META[code]?.country || '',
      emblem: match.competitionLogo || match.competitionEmblem || COMPETITION_META[code]?.emblem || '',
      matches: [],
    }

    current.code = current.code || code
    current.name = current.name || match.competitionName || COMPETITION_META[code]?.name
    current.country = current.country || match.country || COMPETITION_META[code]?.country || ''
    current.emblem = current.emblem || match.competitionLogo || match.competitionEmblem || COMPETITION_META[code]?.emblem || ''
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

function ScorersTable({ scorers = [], loading = false, error = '' }) {
  if (loading && !scorers.length) {
    return <p className="bds-football-center-empty">Carregando artilharia oficial...</p>
  }

  if (!scorers.length) {
    return <p className="bds-football-center-empty">{error || 'Artilharia ainda não disponível para esta competição.'}</p>
  }

  return (
    <div className="bds-football-center-table-wrap">
      <table className="bds-football-center-table imortal-football-scorers-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>Time</th>
            <th>J</th>
            <th>Gols</th>
            <th>Ast.</th>
            <th>Pên.</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((item, index) => (
            <tr key={item.player?.id || `${item.player?.name}-${item.team?.id || index}`}>
              <td><strong>{index + 1}</strong></td>
              <td><strong>{item.player?.name || 'Jogador'}</strong></td>
              <td>
                <span className="bds-football-center-table-team">
                  <MiniCrest src={item.team?.crest} name={item.team?.name} />
                  <strong>{item.team?.shortName || item.team?.name}</strong>
                </span>
              </td>
              <td>{item.playedMatches}</td>
              <td><strong>{item.goals}</strong></td>
              <td>{item.assists ?? '-'}</td>
              <td>{item.penalties ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function StandingsRows({ rows, compact = false }) {
  const visibleRows = compact ? rows.slice(0, 6) : rows

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
            <tr key={row.team?.id || row.name}>
              <td><strong>{row.position}</strong></td>
              <td>
                <span className="bds-football-center-table-team">
                  <MiniCrest src={row.crest || row.team?.crest} name={row.name || row.team?.name} />
                  <strong>{row.name || row.team?.name}</strong>
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

function StandingsTable({ matches, officialStandings = [], compact = false, loading = false, error = '' }) {
  const fallbackRows = useMemo(() => calculateStandings(matches), [matches])
  const officialGroups = useMemo(() => {
    const total = officialStandings.filter((standing) => String(standing.type || '').toUpperCase() === 'TOTAL')
    return (total.length ? total : officialStandings).filter((standing) => standing.rows?.length)
  }, [officialStandings])

  if (loading && !officialGroups.length && !fallbackRows.length) {
    return <p className="bds-football-center-empty">Carregando classificação oficial...</p>
  }

  if (officialGroups.length) {
    const groups = compact ? officialGroups.slice(0, 1) : officialGroups
    return (
      <div className="imortal-football-standings-groups">
        {groups.map((standing, index) => (
          <section key={`${standing.stage}-${standing.group}-${index}`} className="imortal-football-standings-group">
            {!compact && (standing.group || officialGroups.length > 1) ? (
              <h4>{standing.group || standing.stage || 'Classificação'}</h4>
            ) : null}
            <StandingsRows rows={standing.rows} compact={compact} />
          </section>
        ))}
      </div>
    )
  }

  if (fallbackRows.length) {
    return (
      <>
        {error ? <p className="imortal-football-standings-note">Tabela oficial indisponível; exibindo classificação calculada pelos jogos sincronizados.</p> : null}
        <StandingsRows rows={fallbackRows} compact={compact} />
      </>
    )
  }

  return <p className="bds-football-center-empty">{error || 'Classificação ainda não disponível para esta competição.'}</p>
}
function CompetitionSummary({ competition, onOpen, officialStandings, standingsLoading, standingsError }) {
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
        <StandingsTable
          matches={matches}
          officialStandings={officialStandings}
          loading={standingsLoading}
          error={standingsError}
          compact
        />
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
  const [standingsByCode, setStandingsByCode] = useState({})
  const [standingsLoadingCode, setStandingsLoadingCode] = useState('')
  const [standingsErrors, setStandingsErrors] = useState({})
  const [scorersByCode, setScorersByCode] = useState({})
  const [scorersLoadingCode, setScorersLoadingCode] = useState('')
  const [scorersErrors, setScorersErrors] = useState({})
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

  useEffect(() => {
    if (!selectedCompetition?.code || standingsByCode[selectedCompetition.code]) return undefined

    const controller = new AbortController()
    const code = selectedCompetition.code
    setStandingsLoadingCode(code)
    setStandingsErrors((current) => ({ ...current, [code]: '' }))

    fetchOfficialStandings(code, controller.signal)
      .then((payload) => {
        setStandingsByCode((current) => ({ ...current, [code]: payload.standings || [] }))
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStandingsErrors((current) => ({ ...current, [code]: error.message || 'Classificação oficial indisponível.' }))
        }
      })
      .finally(() => {
        setStandingsLoadingCode((current) => current === code ? '' : current)
      })

    return () => controller.abort()
  }, [selectedCompetition?.code, standingsByCode])

  useEffect(() => {
    if (activeTab !== 'scorers' || !selectedCompetition?.code || scorersByCode[selectedCompetition.code]) return undefined

    const controller = new AbortController()
    const code = selectedCompetition.code
    setScorersLoadingCode(code)
    setScorersErrors((current) => ({ ...current, [code]: '' }))

    fetchOfficialScorers(code, controller.signal)
      .then((payload) => {
        setScorersByCode((current) => ({ ...current, [code]: payload.scorers || [] }))
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setScorersErrors((current) => ({ ...current, [code]: error.message || 'Artilharia oficial indisponível.' }))
        }
      })
      .finally(() => {
        setScorersLoadingCode((current) => current === code ? '' : current)
      })

    return () => controller.abort()
  }, [activeTab, selectedCompetition?.code, scorersByCode])
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
          <button type="button" className={activeTab === 'scorers' ? 'is-active' : ''} onClick={() => setActiveTab('scorers')}>Artilharia</button>
        </nav>

        <div className="bds-football-center-content">
          {activeTab === 'summary' && (
            <CompetitionSummary
              competition={selectedCompetition}
              onOpen={openMatch}
              officialStandings={standingsByCode[selectedCompetition.code] || []}
              standingsLoading={standingsLoadingCode === selectedCompetition.code}
              standingsError={standingsErrors[selectedCompetition.code] || ''}
            />
          )}
          {activeTab === 'matches' && <CompetitionMatches competition={selectedCompetition} onOpen={openMatch} />}
          {activeTab === 'standings' && (
            <section className="bds-football-center-block">
              <header className="bds-football-center-block__header"><span><TableProperties size={15} /></span><h3>Classificação completa</h3></header>
              <StandingsTable
                matches={selectedCompetition.matches}
                officialStandings={standingsByCode[selectedCompetition.code] || []}
                loading={standingsLoadingCode === selectedCompetition.code}
                error={standingsErrors[selectedCompetition.code] || ''}
              />
            </section>
          )}
          {activeTab === 'scorers' && (
            <section className="bds-football-center-block">
              <header className="bds-football-center-block__header"><span><Trophy size={15} /></span><h3>Artilharia</h3></header>
              <ScorersTable
                scorers={scorersByCode[selectedCompetition.code] || []}
                loading={scorersLoadingCode === selectedCompetition.code}
                error={scorersErrors[selectedCompetition.code] || ''}
              />
            </section>
          )}
        </div>
      </main>
      </div>
    </section>
  )
}
