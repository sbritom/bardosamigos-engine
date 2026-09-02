import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Globe2, MapPin, Trophy } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState, Loading } from '../../../../design-system'
import { formatBrazilFullDateTime } from '../../../../core/time'
import { getSportsStatusLabel } from '../../../../core/sports'
import { useAuth } from '../../../auth/AuthContext'
import { getFootballTeamDetails, toggleFootballFavorite } from '../../services/footballCenterService'
import { FootballCrest } from '../components/FootballCrest'
import './teamPage.css'

function withPreviewAccess(path) {
  if (typeof window === 'undefined') return path
  const shareToken = new URLSearchParams(window.location.search).get('_vercel_share')
  if (!shareToken) return path
  const url = new URL(path, window.location.origin)
  url.searchParams.set('_vercel_share', shareToken)
  return `${url.pathname}${url.search}`
}

function score(match) {
  return match.hasScore ? `${match.homeScore} x ${match.awayScore}` : 'x'
}

function MatchRow({ match, onOpen }) {
  return (
    <button className="imortal-team-match" type="button" onClick={() => onOpen(match.id)}>
      <div className="imortal-team-match__top">
        <span>{getSportsStatusLabel(match.status)}</span>
        <small>{match.competitionName || 'Futebol'}</small>
      </div>
      <strong>
        {match.homeTeam}
        <em>{score(match)}</em>
        {match.awayTeam}
      </strong>
      <small>{formatBrazilFullDateTime(match.startsAt)}</small>
    </button>
  )
}

function StandingsTable({ rows, teamName }) {
  if (!rows.length) {
    return <p className="imortal-team-empty">Classificação ainda não disponível.</p>
  }

  return (
    <div className="imortal-team-table-wrap">
      <table className="imortal-team-table">
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
          {rows.map((row) => {
            const name = row.name || row.team?.name || ''
            const active = name === teamName
            return (
              <tr key={row.team?.id || name} className={active ? 'is-current' : ''}>
                <td><strong>{row.position}</strong></td>
                <td>
                  <span className="imortal-team-table__club">
                    <FootballCrest src={row.crest || row.team?.crest} name={name} iconSize={14} />
                    <strong>{name}</strong>
                  </span>
                </td>
                <td>{row.played ?? row.playedGames ?? 0}</td>
                <td>{row.wins ?? row.won ?? 0}</td>
                <td>{row.draws ?? row.draw ?? 0}</td>
                <td>{row.losses ?? row.lost ?? 0}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference ?? 0}</td>
                <td><strong>{row.points ?? 0}</strong></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function FootballTeamPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { openAuth } = useAuth()
  const [state, setState] = useState({ loading: true, data: null, error: '', message: '' })
  const [officialStandings, setOfficialStandings] = useState([])

  useEffect(() => {
    let active = true

    setState((current) => ({
      ...current,
      loading: true,
      data: null,
      error: '',
      message: '',
    }))

    async function loadTeam() {
      const result = await getFootballTeamDetails(teamId)
      if (!active) return

      setState((current) => ({
        ...current,
        loading: false,
        data: result.data,
        error: result.error?.message || '',
      }))
    }

    loadTeam()

    return () => {
      active = false
    }
  }, [teamId])

  const competitionCode = useMemo(() => {
    const team = state.data?.team || {}
    return String(
      team.competitions?.code
      || team.competitions?.metadata?.code
      || team.metadata?.competitionCode
      || team.metadata?.code
      || '',
    ).toUpperCase()
  }, [state.data?.team])

  useEffect(() => {
    if (!competitionCode) {
      setOfficialStandings([])
      return undefined
    }

    const controller = new AbortController()
    fetch(withPreviewAccess(`/api/football/matches?resource=standings&competition=${encodeURIComponent(competitionCode)}`), {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const groups = payload?.standings || []
        const total = groups.find((item) => String(item.type || '').toUpperCase() === 'TOTAL')
        setOfficialStandings(total?.rows || groups[0]?.rows || [])
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setOfficialStandings([])
      })

    return () => controller.abort()
  }, [competitionCode])

  async function favorite() {
    const team = state.data?.team
    if (!team) return

    const result = await toggleFootballFavorite({
      type: 'team',
      id: team.id,
      metadata: {
        name: team.name,
        crest: team.crestUrl || team.logoUrl,
        country: team.country,
      },
    })

    if (!result.authenticated) {
      openAuth('Entre para favoritar este time.', 'login')
      return
    }

    setState((current) => ({
      ...current,
      message: result.error?.message || (result.favorited ? 'Time favoritado.' : 'Favorito removido.'),
    }))
  }

  if (state.loading) return <Loading label="Carregando time" />
  if (state.error) return <EmptyState title="Erro ao carregar time" description={state.error} />
  if (!state.data) return <EmptyState title="Time não encontrado" description="A equipe pode não estar sincronizada." />

  const { team, upcoming, finished, standings } = state.data
  const crest = team.crestUrl || team.crest_url || team.logoUrl || team.logo_url || team.metadata?.crest || ''
  const tableRows = officialStandings.length ? officialStandings : standings

  return (
    <main className="imortal-team-page">
      <div className="imortal-team-topbar">
        <button type="button" onClick={() => navigate('/football')}>
          <ArrowLeft size={16} />
          Voltar ao Futebol
        </button>
        <button type="button" className="is-favorite" onClick={favorite}>Favoritar</button>
      </div>

      <section className="imortal-team-hero">
        <span className="imortal-team-crest">
          <FootballCrest src={crest} name={team.name} iconSize={42} />
        </span>
        <div>
          <span>IMORTAL0800 • FUTEBOL</span>
          <h1>{team.name}</h1>
          <p>{team.country || 'Futebol'} · {team.competitionName || team.competitions?.name || 'Competição'}</p>
        </div>
      </section>

      {state.message ? <p className="imortal-team-message">{state.message}</p> : null}

      <section className="imortal-team-facts">
        <article>
          <MapPin size={17} />
          <div><span>Estádio</span><strong>{team.venue || 'Não informado'}</strong></div>
        </article>
        <article>
          <Globe2 size={17} />
          <div><span>Website</span><strong>{team.website || 'Não informado'}</strong></div>
        </article>
        <article>
          <CalendarDays size={17} />
          <div><span>Fundação</span><strong>{team.founded || 'Não informado'}</strong></div>
        </article>
        <article>
          <Trophy size={17} />
          <div><span>Cores</span><strong>{team.clubColors || team.club_colors || 'Não informado'}</strong></div>
        </article>
      </section>

      <section className="imortal-team-grid">
        <article className="imortal-team-panel">
          <header>
            <span>PRÓXIMOS JOGOS</span>
            <h2>Agenda</h2>
          </header>
          <div className="imortal-team-match-list">
            {upcoming.length
              ? upcoming.slice(0, 8).map((match) => (
                <MatchRow key={match.id} match={match} onOpen={(id) => navigate(`/football/jogos/${id}`)} />
              ))
              : <p className="imortal-team-empty">Nenhum jogo futuro disponível.</p>}
          </div>
        </article>

        <article className="imortal-team-panel">
          <header>
            <span>ÚLTIMOS RESULTADOS</span>
            <h2>Forma recente</h2>
          </header>
          <div className="imortal-team-match-list">
            {finished.length
              ? finished.slice(0, 8).map((match) => (
                <MatchRow key={match.id} match={match} onOpen={(id) => navigate(`/football/jogos/${id}`)} />
              ))
              : <p className="imortal-team-empty">Nenhum resultado disponível.</p>}
          </div>
        </article>
      </section>

      <section className="imortal-team-panel">
        <header>
          <span>{officialStandings.length ? 'TABELA OFICIAL' : 'CLASSIFICAÇÃO'}</span>
          <h2>Posição na competição</h2>
        </header>
        <StandingsTable rows={tableRows} teamName={team.name} />
      </section>
    </main>
  )
}
