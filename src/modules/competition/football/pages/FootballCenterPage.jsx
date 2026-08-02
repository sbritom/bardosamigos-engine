import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, ListOrdered, Radio, RefreshCw, ScrollText, Trophy } from 'lucide-react'
import { Button, EmptyState } from '../../../../design-system'
import { PortalWorkspace, WorkspaceSearch, WorkspaceSkeleton } from '../../../../shared/workspace'
import { FootballBrasileiraoHub } from '../components/FootballBrasileiraoHub'
import { FootballEmptyState, FootballPanel } from '../components/FootballCommon'
import { FootballHero } from '../components/FootballHero'
import { FootballBreadcrumb } from '../components/FootballNavigation'
import { FootballSearchResults } from '../components/FootballSearchResults'
import { FootballSection } from '../components/FootballSection'
import { useFootballCenterView } from '../hooks/useFootballCenterView'
import { footballMatchBelongsToCompetition, getFootballFavoriteKeys } from '../utils/footballCenterUtils'
import { calculateStandings, listFootballCenterData, toggleFootballFavorite } from '../../services/footballCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../services/footballAutoSyncService'
import './footballMotion.css'

const BRASILEIRAO_NAV_ITEM = {
  id: 'BSA',
  codes: ['bsa'],
  patterns: ['brasileir', 'serie a brasil'],
}

const WORKSPACE_VIEWS = {
  brasileirao: {
    title: 'Brasileirao',
    description: 'Classificacao, rodada, jogos de hoje, proximos jogos e resultados da Serie A.',
  },
  live: {
    title: 'Ao Vivo',
    description: 'Partidas em andamento com placar e status sincronizados.',
  },
  today: {
    title: 'Jogos de Hoje',
    description: 'Agenda do dia com partidas reais da Central.',
  },
  standings: {
    title: 'Classificacao',
    description: 'Tabela calculada a partir dos resultados sincronizados.',
  },
  round: {
    title: 'Rodada',
    description: 'Partidas da rodada atual da competicao em destaque.',
  },
  upcoming: {
    title: 'Proximos Jogos',
    description: 'Confrontos agendados em ordem cronologica.',
  },
  results: {
    title: 'Resultados',
    description: 'Ultimas partidas encerradas.',
  },
}

function getRoundMatches(matches = [], reference) {
  const roundName = reference?.round?.name || matches.find((match) => match.round?.name)?.round?.name
  if (!roundName) return []
  return matches.filter((match) => match.round?.name === roundName)
}

function FootballStandingsPanel({ matches }) {
  const rows = useMemo(() => calculateStandings(matches), [matches])

  return (
    <FootballPanel title="Classificacao" eyebrow="Tabela" icon={ListOrdered}>
      {rows.length ? (
        <div className="overflow-x-auto border-y border-[color-mix(in_srgb,var(--bds-color-border)_48%,transparent)]">
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--bds-font-micro)] uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">
              <tr>
                <th scope="col" className="py-[var(--bds-space-5)] pl-[var(--bds-space-8)]">#</th>
                <th scope="col" className="py-[var(--bds-space-5)]">Clube</th>
                <th scope="col" className="py-[var(--bds-space-5)] text-right">Pts</th>
                <th scope="col" className="py-[var(--bds-space-5)] text-right">J</th>
                <th scope="col" className="py-[var(--bds-space-5)] pr-[var(--bds-space-8)] text-right">SG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color-mix(in_srgb,var(--bds-color-border)_42%,transparent)]">
              {rows.map((row) => (
                <tr key={row.name} className="text-[var(--bds-color-text-secondary)]">
                  <td className="py-[var(--bds-space-5)] pl-[var(--bds-space-8)] font-black tabular-nums text-[var(--bds-color-primary-hover)]">{row.position}</td>
                  <td className="min-w-0 py-[var(--bds-space-5)]">
                    <span className="truncate font-black text-[var(--bds-color-text)]">{row.name}</span>
                  </td>
                  <td className="py-[var(--bds-space-5)] text-right font-black tabular-nums text-[var(--bds-color-text)]">{row.points}</td>
                  <td className="py-[var(--bds-space-5)] text-right tabular-nums">{row.played}</td>
                  <td className="py-[var(--bds-space-5)] pr-[var(--bds-space-8)] text-right tabular-nums">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <FootballEmptyState compact title="Nenhuma classificacao disponivel." />
      )}
    </FootballPanel>
  )
}

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [activeWorkspace, setActiveWorkspace] = useState('brasileirao')
  const [searchTerm, setSearchTerm] = useState('')
  const [favoriteMessage, setFavoriteMessage] = useState('')
  const hasLiveMatchRef = useRef(false)
  const data = state.data

  async function load({ syncFirst = false } = {}) {
    if (syncFirst) await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
    const result = await listFootballCenterData()
    hasLiveMatchRef.current = hasLiveFootballMatch(result.data)
    setState({ loading: false, data: result.data, error: result.error?.message || '' })
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

  const favoriteKeys = useMemo(() => getFootballFavoriteKeys(data?.favorites), [data?.favorites])
  const derived = useFootballCenterView({ data, activeCompetition: 'all', activeFilter: 'all', favoriteKeys, searchTerm })
  const brasileiraoMatches = useMemo(() => (
    (derived.searchedMatches || []).filter((match) => footballMatchBelongsToCompetition(match, BRASILEIRAO_NAV_ITEM))
  ), [derived.searchedMatches])
  const roundMatches = useMemo(() => getRoundMatches(derived.searchedMatches, derived.hero), [derived.hero, derived.searchedMatches])
  const standingsSource = brasileiraoMatches.length ? brasileiraoMatches : derived.searchedMatches
  const standingsCount = useMemo(() => calculateStandings(standingsSource).length, [standingsSource])

  async function toggleFavorite(type, id, metadata) {
    setFavoriteMessage('')
    const result = await toggleFootballFavorite({ type, id, metadata })
    if (result.error) {
      setFavoriteMessage(result.error.message)
      return
    }
    setFavoriteMessage(result.favorited ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.')
    await load()
  }

  function favoriteTeam(team) {
    return toggleFavorite('team', team.id, { name: team.name, crest: team.crest, competitionName: team.competitionName })
  }

  function favoriteMatch(match) {
    return toggleFavorite('match', match.id, {
      name: `${match.homeTeam} x ${match.awayTeam}`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      competitionName: match.competitionName,
      startsAt: match.startsAt,
    })
  }

  function openTeamByName(name) {
    const team = data?.teams?.find((item) => item.name === name)
    if (team) navigate(`/football/times/${team.id}`)
  }

  function openTeam(team) {
    navigate(`/football/times/${team.id}`)
  }

  function openMatch(matchId) {
    navigate(`/football/jogos/${matchId}`)
  }

  function clearWorkspace() {
    setSearchTerm('')
    setActiveWorkspace('brasileirao')
  }

  function renderWorkspaceContent() {
    if (searchTerm) {
      return (
        <FootballSearchResults
          query={searchTerm}
          teams={derived.searchTeams}
          competitions={derived.searchCompetitions}
          matches={derived.matches}
          favoriteKeys={favoriteKeys}
          onTeam={openTeam}
          onFavoriteTeam={favoriteTeam}
          onOpen={openMatch}
          onFavoriteMatch={favoriteMatch}
          onClear={clearWorkspace}
        />
      )
    }

    if (activeWorkspace === 'brasileirao') {
      return brasileiraoMatches.length ? (
        <FootballBrasileiraoHub matches={brasileiraoMatches} onOpen={openMatch} />
      ) : (
        <FootballEmptyState compact title="Nenhum jogo do Brasileirao encontrado." />
      )
    }

    if (activeWorkspace === 'live') return <FootballSection title="Ao Vivo" icon={Radio} matches={derived.live} onOpen={openMatch} emptyTitle="Nenhuma partida ao vivo." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
    if (activeWorkspace === 'today') return <FootballSection title="Jogos de Hoje" icon={CalendarDays} matches={derived.today} onOpen={openMatch} emptyTitle="Nenhum jogo hoje." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
    if (activeWorkspace === 'standings') return <FootballStandingsPanel matches={standingsSource} />
    if (activeWorkspace === 'round') return <FootballSection title="Rodada" eyebrow="Partidas da rodada atual" icon={Trophy} matches={roundMatches} onOpen={openMatch} emptyTitle="Nenhuma partida da rodada." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
    if (activeWorkspace === 'upcoming') return <FootballSection title="Proximos Jogos" icon={Clock3} matches={derived.upcoming} onOpen={openMatch} emptyTitle="Nenhum proximo jogo." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
    return <FootballSection title="Resultados" icon={CheckCircle2} matches={derived.results} onOpen={openMatch} emptyTitle="Nenhum resultado." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
  }

  if (state.loading) {
    return (
      <section className="bds-football-page space-y-[var(--bds-space-14)]">
        <WorkspaceSkeleton rows={6} />
        <p className="sr-only" aria-live="polite">Carregando central do futebol</p>
      </section>
    )
  }

  if (state.error) return <EmptyState title="Nao foi possivel carregar o futebol" description={state.error} />
  if (!data) return <EmptyState title="Nenhum dado sincronizado" description="Execute a sincronizacao Football-Data para preencher a central." />

  const activeView = searchTerm ? { title: 'Busca', description: 'Resultados encontrados na Central de Futebol.' } : WORKSPACE_VIEWS[activeWorkspace]
  const workspaceItems = [
    { id: 'brasileirao', icon: Trophy, name: 'Brasileirao', badge: brasileiraoMatches.length || undefined },
    { id: 'live', icon: Radio, name: 'Ao Vivo', badge: derived.live.length || undefined, status: derived.live.length ? 'AO VIVO' : undefined },
    { id: 'today', icon: CalendarDays, name: 'Jogos de Hoje', badge: derived.today.length || undefined },
    { id: 'standings', icon: ListOrdered, name: 'Classificacao', badge: standingsCount || undefined },
    { id: 'round', icon: Trophy, name: 'Rodada', badge: roundMatches.length || undefined },
    { id: 'upcoming', icon: Clock3, name: 'Proximos Jogos', badge: derived.upcoming.length || undefined },
    { id: 'results', icon: ScrollText, name: 'Resultados', badge: derived.results.length || undefined },
  ]

  return (
    <section className="bds-football-page space-y-[var(--bds-space-14)]">
      <FootballBreadcrumb activeCompetition="all" onHome={() => navigate('/')} onFootball={clearWorkspace} />
      <p className="sr-only" aria-live="polite">{favoriteMessage}</p>

      <FootballHero match={derived.hero} onOpen={openMatch} onTeam={openTeamByName} teams={data.teams || []} favoriteKeys={favoriteKeys} onFavoriteTeam={favoriteTeam} />

      <PortalWorkspace
        className="bds-football-workspace"
        header={{
          eyebrow: 'Central de Futebol',
          title: activeView.title,
          description: activeView.description,
          search: (
            <WorkspaceSearch
              label="Pesquisar futebol"
              placeholder="Pesquisar times, competicoes ou partidas..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          ),
          actions: (
            <Button variant="secondary" onClick={() => load({ syncFirst: true })}>
              <RefreshCw size={14} aria-hidden="true" />
              Atualizar
            </Button>
          ),
        }}
        sidebar={{
          title: 'Futebol',
          items: workspaceItems,
          selectedId: activeWorkspace,
          onSelect: (item) => {
            setActiveWorkspace(item.id)
            setSearchTerm('')
          },
        }}
        content={{ title: activeView.title, description: activeView.description }}
      >
        {renderWorkspaceContent()}
      </PortalWorkspace>
    </section>
  )
}
