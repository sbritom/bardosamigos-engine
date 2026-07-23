import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, Heart, Radio } from 'lucide-react'
import { EmptyState, Loading } from '../../../../design-system'
import { FootballCompetitionGrid, FootballWorldCup } from '../components/FootballCompetitions'
import { FootballFilterBar } from '../components/FootballFilterBar'
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

export default function FootballCenterPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedCompetition, setSelectedCompetition] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [competitionSort, setCompetitionSort] = useState('alphabetical')
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

  function favoriteCompetition(competition) {
    return toggleFavorite('competition', competition.id, { name: competition.name, code: competition.code, logo: competition.logo })
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

  function clearCompetitionFilters() {
    setSearchTerm('')
    setActiveFilter('all')
  }

  if (state.loading) {
    return (
      <section className="space-y-[var(--bds-space-24)]">
        <div className="h-[34rem] animate-pulse rounded-[var(--bds-radius-hero)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)]" />
        <div className="grid gap-[var(--bds-space-16)] md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-[var(--bds-radius-lg)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)]" />
          ))}
        </div>
        <Loading label="Carregando central do futebol" />
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
    onSelect: selectCompetition,
  }

  return (
    <section className="space-y-[var(--bds-space-18)]">
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

      <div className="grid min-w-0 items-start gap-[var(--bds-space-16)] lg:grid-cols-[minmax(13.5rem,15rem)_minmax(0,1fr)_minmax(18rem,20rem)] xl:gap-[var(--bds-space-18)] 2xl:grid-cols-[minmax(14.5rem,16rem)_minmax(0,1fr)_minmax(20rem,21.5rem)]">
        <FootballSidebar {...sidebarProps} />

        <main className="min-w-0 space-y-[var(--bds-space-16)]">
          <FootballHero match={derived.hero} stats={derived.stats} onOpen={openMatch} onTeam={openTeamByName} teams={data.teams || []} favoriteKeys={favoriteKeys} onFavoriteTeam={favoriteTeam} />
          <FootballSummaryCards stats={derived.stats} onSelect={setActiveFilter} />
          <FootballFilterBar activeFilter={activeFilter} onChange={setActiveFilter} onOpenMenu={() => setDrawerOpen(true)} />

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
              emptyDescription="Ajuste os filtros para explorar os outros jogos carregados."
              favoriteKeys={favoriteKeys}
              onFavorite={favoriteMatch}
              onClear={clearExperienceFilters}
            />
          ) : null}

          {!searchTerm && activeFilter === 'all' ? (
            <>
              <FootballSection title="Ao Vivo" eyebrow="Prioridade maxima" icon={Radio} matches={derived.live} onOpen={openMatch} emptyTitle="Nenhuma partida ao vivo" emptyDescription="A central continua monitorando os jogos carregados." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} onClear={clearExperienceFilters} />
              <FootballSection title="Jogos de Hoje" eyebrow="Agenda do dia" icon={CalendarDays} matches={derived.today} onOpen={openMatch} emptyTitle="Nenhum jogo hoje" emptyDescription="Confira resultados recentes e proximos confrontos." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} onClear={clearExperienceFilters} />
              <FootballSection title="Ultimos Resultados" eyebrow="Placares recentes" icon={CheckCircle2} matches={derived.results} onOpen={openMatch} emptyTitle="Nenhum resultado disponivel" emptyDescription="Os proximos jogos seguem organizados na agenda." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} onClear={clearExperienceFilters} />
              <FootballSection title="Proximos Jogos" eyebrow="Calendario" icon={Clock3} matches={derived.upcoming} onOpen={openMatch} emptyTitle="Nenhum proximo jogo sincronizado" emptyDescription="A agenda sera preenchida com os dados ja carregados." favoriteKeys={favoriteKeys} onFavorite={favoriteMatch} onClear={clearExperienceFilters} />
              <FootballWorldCup data={{ ...data, matches: derived.searchedMatches }} onOpen={openMatch} />
              <FootballCompetitionGrid
                competitions={(data.competitions || []).filter((competition) => selectedCompetition === 'all' || derived.searchedMatches.some((match) => match.competitionId === competition.id))}
                matches={derived.searchedMatches}
                favoriteKeys={favoriteKeys}
                activeCompetition={selectedCompetition}
                onSelect={selectCompetition}
                onFavorite={favoriteCompetition}
                sortBy={competitionSort}
                onSort={setCompetitionSort}
              />
            </>
          ) : null}
        </main>

        <div className="hidden lg:sticky lg:top-[var(--bds-space-24)] lg:block">
          <FootballRightPanel data={data} derived={derived} onOpen={openMatch} />
        </div>
      </div>

      <div className="lg:hidden">
        <FootballRightPanel data={data} derived={derived} onOpen={openMatch} />
      </div>
    </section>
  )
}
