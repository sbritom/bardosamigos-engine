import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, Radio } from 'lucide-react'
import { EmptyState } from '../../../../design-system'
import { FootballHero, FootballSummaryCards } from '../components/FootballHero'
import { FootballBreadcrumb, FootballExperienceBar } from '../components/FootballNavigation'
import { FootballRightPanel } from '../components/FootballRightPanel'
import { FootballSearchResults } from '../components/FootballSearchResults'
import { FootballSection } from '../components/FootballSection'
import { FootballDrawer, FootballSidebar } from '../components/FootballSidebar'
import { FOOTBALL_FOCUSED_VIEWS } from '../constants/footballCenterConstants'
import { useFootballCenterView } from '../hooks/useFootballCenterView'
import { getFootballFavoriteKeys } from '../utils/footballCenterUtils'
import { listFootballCenterData, toggleFootballFavorite } from '../../services/footballCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../services/footballAutoSyncService'
import './footballMotion.css'

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedCompetition, setSelectedCompetition] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
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
  const derived = useFootballCenterView({ data, activeCompetition: selectedCompetition, activeFilter, favoriteKeys, searchTerm })

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

  function selectCompetition(id) {
    setSelectedCompetition(id)
    setActiveFilter(id === 'favorites' ? 'favorites' : 'all')
    setSearchTerm('')
    setDrawerOpen(false)
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

  function clearExperienceFilters() {
    setSearchTerm('')
    setActiveFilter('all')
    setSelectedCompetition('all')
  }

  if (state.loading) {
    return (
      <section className="bds-football-page space-y-[var(--bds-space-14)]">
        <div className="bds-football-skeleton h-12 rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_44%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_26%,transparent)]" />
        <div className="grid gap-[var(--bds-space-14)] lg:grid-cols-[minmax(12rem,14rem)_minmax(0,1fr)]">
          <div className="bds-football-skeleton hidden h-[28rem] rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_44%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_18%,transparent)] lg:block" />
          <div className="space-y-[var(--bds-space-10)]">
            <div className="bds-football-skeleton h-[14rem] rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_44%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_22%,transparent)]" />
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bds-football-skeleton h-16 border-y border-[color-mix(in_srgb,var(--bds-color-border)_32%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_12%,transparent)]" />
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">Carregando central do futebol</p>
      </section>
    )
  }

  if (state.error) return <EmptyState title="Nao foi possivel carregar o futebol" description={state.error} />
  if (!data) return <EmptyState title="Nenhum dado sincronizado" description="Execute a sincronizacao Football-Data para preencher a central." />

  const focusedView = FOOTBALL_FOCUSED_VIEWS[activeFilter]
  const sidebarProps = {
    matches: data.matches || [],
    activeCompetition: selectedCompetition,
    favoriteCount: favoriteKeys.size,
    activeFilter,
    onSelect: selectCompetition,
    onFilter: setActiveFilter,
  }

  return (
    <section className="bds-football-page space-y-[var(--bds-space-14)]">
      <FootballDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...sidebarProps} />
      <FootballBreadcrumb activeCompetition={selectedCompetition} onHome={() => navigate('/')} onFootball={clearExperienceFilters} />
      <FootballExperienceBar
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onClear={() => setSearchTerm('')}
        lastUpdatedAt={data.lastUpdatedAt}
        totalMatches={data.matches?.length || 0}
        onOpenMenu={() => setDrawerOpen(true)}
        onRefresh={() => load({ syncFirst: true })}
      />
      <p className="sr-only" aria-live="polite">{favoriteMessage}</p>

      <div className="grid min-w-0 items-start gap-[var(--bds-space-14)] lg:grid-cols-[minmax(12rem,14rem)_minmax(0,1fr)] xl:grid-cols-[minmax(13rem,15rem)_minmax(0,1fr)]">
        <FootballSidebar {...sidebarProps} />

        <main className="min-w-0 space-y-[var(--bds-space-12)]">
          <FootballHero match={derived.hero} onOpen={openMatch} onTeam={openTeamByName} teams={data.teams || []} favoriteKeys={favoriteKeys} onFavoriteTeam={favoriteTeam} />
          <FootballSummaryCards stats={derived.stats} onSelect={setActiveFilter} />

          {searchTerm ? (
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
              onClear={clearExperienceFilters}
            />
          ) : null}

          {!searchTerm && focusedView ? (
            <FootballSection
              title={focusedView.title}
              eyebrow={focusedView.eyebrow}
              icon={focusedView.icon}
              matches={derived.matches}
              onOpen={openMatch}
              emptyTitle={`Nenhuma partida em "${focusedView.title}"`}
              favoriteKeys={favoriteKeys}
              onFavorite={favoriteMatch}
            />
          ) : null}

          {!searchTerm && activeFilter === 'all' ? (
            <>
              <FootballSection title="Ao Vivo" icon={Radio} matches={derived.live} onOpen={openMatch} emptyTitle="Nenhuma partida ao vivo." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
              <FootballSection title="Jogos de Hoje" icon={CalendarDays} matches={derived.today} onOpen={openMatch} emptyTitle="Nenhum jogo hoje." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
              <FootballSection title="Proximos Jogos" icon={Clock3} matches={derived.upcoming} onOpen={openMatch} emptyTitle="Nenhum proximo jogo." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
              <FootballSection title="Ultimos Resultados" icon={CheckCircle2} matches={derived.results} onOpen={openMatch} emptyTitle="Nenhum resultado." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} />
              <FootballRightPanel data={data} />
            </>
          ) : null}
        </main>
      </div>
    </section>
  )
}
